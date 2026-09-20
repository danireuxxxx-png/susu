-- =====================================================================
-- 0010 — Operações transacionais
--
-- Fluxos que tocam várias tabelas vivem em funções: uma função é uma
-- transação, então ou tudo acontece ou nada acontece. A API chama estas
-- funções em vez de encadear escritas soltas.
-- =====================================================================

-- Converter lead: lead → oportunidade + histórico + atividade.
create or replace function public.convert_lead(
  p_lead_id uuid,
  p_stage_id uuid default null,
  p_pipeline_id uuid default null,
  p_title text default null,
  p_value numeric default null,
  p_expected_close_date date default null,
  p_owner_id uuid default null
)
returns jsonb
language plpgsql
volatile
as $$
declare
  v_lead public.leads;
  v_pipeline_id uuid;
  v_stage_id uuid;
  v_company_id uuid;
  v_opportunity public.opportunities;
begin
  select * into v_lead from public.leads where id = p_lead_id and deleted_at is null for update;

  if not found then
    raise exception 'lead % not found', p_lead_id using errcode = 'P0002';
  end if;

  if v_lead.status = 'CONVERTED' then
    raise exception 'lead % already converted', p_lead_id using errcode = 'P0001';
  end if;

  -- Pipeline: o informado, senão o padrão da organização.
  v_pipeline_id := coalesce(
    p_pipeline_id,
    (select id from public.pipelines
      where organization_id = v_lead.organization_id and is_default
      limit 1)
  );

  if v_pipeline_id is null then
    raise exception 'no pipeline available for organization %', v_lead.organization_id using errcode = 'P0002';
  end if;

  -- Etapa: a informada, senão a primeira do funil.
  v_stage_id := coalesce(
    p_stage_id,
    (select id from public.pipeline_stages
      where pipeline_id = v_pipeline_id
      order by position
      limit 1)
  );

  if v_stage_id is null then
    raise exception 'pipeline % has no stages', v_pipeline_id using errcode = 'P0002';
  end if;

  -- Sem empresa vinculada, cria uma a partir do próprio lead.
  v_company_id := v_lead.company_id;
  if v_company_id is null then
    insert into public.companies (organization_id, trade_name, email, phone, owner_id)
    values (v_lead.organization_id, v_lead.name, v_lead.email, v_lead.phone, coalesce(p_owner_id, v_lead.owner_id))
    returning id into v_company_id;
  end if;

  insert into public.opportunities (
    organization_id, pipeline_id, stage_id, company_id, contact_id, lead_id, owner_id,
    title, value, probability, source, expected_close_date, last_interaction_at
  )
  values (
    v_lead.organization_id,
    v_pipeline_id,
    v_stage_id,
    v_company_id,
    v_lead.contact_id,
    v_lead.id,
    coalesce(p_owner_id, v_lead.owner_id),
    coalesce(nullif(btrim(p_title), ''), v_lead.name),
    coalesce(p_value, v_lead.estimated_value, 0),
    coalesce((select probability from public.pipeline_stages where id = v_stage_id), 0),
    v_lead.source,
    p_expected_close_date,
    now()
  )
  returning * into v_opportunity;

  insert into public.opportunity_stage_history (organization_id, opportunity_id, to_stage_id, changed_by, note)
  values (v_lead.organization_id, v_opportunity.id, v_stage_id, auth.uid(), 'Oportunidade criada a partir do lead');

  insert into public.activities (
    organization_id, company_id, contact_id, lead_id, opportunity_id, owner_id,
    type, status, title, notes, completed_at
  )
  values (
    v_lead.organization_id, v_company_id, v_lead.contact_id, v_lead.id, v_opportunity.id,
    coalesce(p_owner_id, v_lead.owner_id), 'NOTE', 'DONE', 'Lead convertido em oportunidade',
    format('Lead %s convertido.', v_lead.name), now()
  );

  update public.leads
  set status = 'CONVERTED',
      converted_at = now(),
      company_id = v_company_id
  where id = v_lead.id;

  return to_jsonb(v_opportunity);
end;
$$;

comment on function public.convert_lead is
  'Converte um lead em oportunidade criando histórico e atividade na mesma transação.';

-- Mover etapa: atualiza o negócio e registra a passagem pelo funil.
create or replace function public.move_opportunity_stage(
  p_opportunity_id uuid,
  p_stage_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
volatile
as $$
declare
  v_opportunity public.opportunities;
  v_stage public.pipeline_stages;
  v_from_stage uuid;
begin
  select * into v_opportunity
  from public.opportunities
  where id = p_opportunity_id and deleted_at is null
  for update;

  if not found then
    raise exception 'opportunity % not found', p_opportunity_id using errcode = 'P0002';
  end if;

  select * into v_stage from public.pipeline_stages where id = p_stage_id;

  if not found then
    raise exception 'stage % not found', p_stage_id using errcode = 'P0002';
  end if;

  if v_stage.pipeline_id <> v_opportunity.pipeline_id then
    raise exception 'stage % does not belong to pipeline %', p_stage_id, v_opportunity.pipeline_id
      using errcode = '23514';
  end if;

  v_from_stage := v_opportunity.stage_id;

  update public.opportunities
  set stage_id = v_stage.id,
      probability = v_stage.probability,
      won_at = case when v_stage.is_won then coalesce(won_at, now()) else null end,
      lost_at = case when v_stage.is_lost then coalesce(lost_at, now()) else null end,
      last_interaction_at = now()
  where id = v_opportunity.id
  returning * into v_opportunity;

  insert into public.opportunity_stage_history (
    organization_id, opportunity_id, from_stage_id, to_stage_id, changed_by, note
  )
  values (v_opportunity.organization_id, v_opportunity.id, v_from_stage, v_stage.id, auth.uid(), p_note);

  return to_jsonb(v_opportunity);
end;
$$;

-- Venda ganha vira projeto: é aqui que o CRM passa a medir custo e lucro.
create or replace function public.create_project_from_opportunity(
  p_opportunity_id uuid,
  p_name text default null,
  p_monthly_revenue numeric default null,
  p_setup_revenue numeric default 0,
  p_start_date date default current_date,
  p_status public.project_status default 'ONBOARDING'
)
returns jsonb
language plpgsql
volatile
-- SECURITY DEFINER com checagem própria: o fluxo grava a receita de
-- implantação, e quem fecha a venda (MANAGER) não tem escrita no
-- financeiro. Em vez de afrouxar a policy de revenues para todo mundo,
-- a elevação fica restrita a esta operação, que valida o papel antes.
security definer
set search_path = public, pg_temp
as $$
declare
  v_opportunity public.opportunities;
  v_project public.projects;
  -- Um NULL explícito do chamador não aciona o default do parâmetro,
  -- então a data é normalizada aqui.
  v_start_date date := coalesce(p_start_date, current_date);
begin
  select * into v_opportunity
  from public.opportunities
  where id = p_opportunity_id and deleted_at is null
  for update;

  if not found then
    raise exception 'opportunity % not found', p_opportunity_id using errcode = 'P0002';
  end if;

  if v_opportunity.company_id is null then
    raise exception 'opportunity % has no company', p_opportunity_id using errcode = '23502';
  end if;

  -- A elevação de privilégio para aqui: sem papel de entrega na
  -- organização da oportunidade, a operação é recusada.
  if not public.has_org_role(
    v_opportunity.organization_id,
    array['OWNER', 'ADMIN', 'MANAGER']::public.org_role[]
  ) then
    raise exception 'insufficient privilege to create project' using errcode = '42501';
  end if;

  insert into public.projects (
    organization_id, company_id, opportunity_id, owner_id, name, status,
    start_date, monthly_revenue, setup_revenue, currency
  )
  values (
    v_opportunity.organization_id,
    v_opportunity.company_id,
    v_opportunity.id,
    v_opportunity.owner_id,
    coalesce(nullif(btrim(p_name), ''), v_opportunity.title),
    coalesce(p_status, 'ONBOARDING'),
    v_start_date,
    coalesce(p_monthly_revenue, 0),
    coalesce(p_setup_revenue, 0),
    v_opportunity.currency
  )
  returning * into v_project;

  -- Implantação é receita pontual: entra no caixa, não no MRR.
  if coalesce(p_setup_revenue, 0) > 0 then
    insert into public.revenues (
      organization_id, company_id, project_id, opportunity_id,
      description, amount, currency, type, status, competence_date, due_date
    )
    values (
      v_project.organization_id, v_project.company_id, v_project.id, v_opportunity.id,
      format('Implantação — %s', v_project.name), p_setup_revenue, v_project.currency,
      'SETUP', 'PENDING', v_start_date, v_start_date + 15
    );
  end if;

  insert into public.activities (
    organization_id, company_id, opportunity_id, project_id, owner_id,
    type, status, title, completed_at
  )
  values (
    v_project.organization_id, v_project.company_id, v_opportunity.id, v_project.id,
    v_opportunity.owner_id, 'NOTE', 'DONE', 'Projeto criado a partir da oportunidade', now()
  );

  return to_jsonb(v_project);
end;
$$;

comment on function public.create_project_from_opportunity is
  'Transforma a venda em projeto e registra a receita de implantação, atomicamente.';

-- Fecha o mês de um projeto: gera a receita recorrente da competência.
create or replace function public.generate_monthly_revenues(
  p_organization_id uuid,
  p_competence date default date_trunc('month', current_date)::date
)
returns integer
language plpgsql
volatile
as $$
declare
  v_inserted integer := 0;
begin
  with novos as (
    insert into public.revenues (
      organization_id, company_id, project_id, description, amount, currency,
      type, status, competence_date, due_date
    )
    select
      p.organization_id,
      p.company_id,
      p.id,
      format('Mensalidade — %s', p.name),
      p.monthly_revenue,
      p.currency,
      'MONTHLY',
      'PENDING',
      date_trunc('month', p_competence)::date,
      (date_trunc('month', p_competence) + interval '9 days')::date
    from public.projects p
    where p.organization_id = p_organization_id
      and p.status = 'ACTIVE'
      and p.deleted_at is null
      and p.monthly_revenue > 0
      -- Idempotente: não duplica a competência já gerada.
      and not exists (
        select 1 from public.revenues r
        where r.project_id = p.id
          and r.type = 'MONTHLY'
          and r.deleted_at is null
          and date_trunc('month', r.competence_date) = date_trunc('month', p_competence)
      )
    returning 1
  )
  select count(*) into v_inserted from novos;

  return v_inserted;
end;
$$;

comment on function public.generate_monthly_revenues is
  'Gera as mensalidades da competência para projetos ativos. Idempotente por projeto/mês.';
