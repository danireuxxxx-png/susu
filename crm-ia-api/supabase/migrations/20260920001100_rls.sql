-- =====================================================================
-- 0011 — Row Level Security
--
-- Princípio: a API valida, mas quem garante o isolamento é o banco.
-- Nenhuma linha de outra organização é visível nem alterável, mesmo que
-- a aplicação tenha um bug ou alguém consulte o Postgres direto com um
-- token de usuário.
--
-- Papéis:
--   OWNER/ADMIN  — tudo
--   MANAGER      — comercial e entrega
--   SALES        — comercial
--   FINANCE      — financeiro e custos
--   VIEWER       — somente leitura
-- =====================================================================

-- Nenhum dado de negócio é acessível sem autenticação.
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
revoke all on all sequences in schema public from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- ---------------------------------------------------------------------
-- Policies padrão das tabelas com organization_id
-- ---------------------------------------------------------------------
do $$
declare
  r record;
  v_select_policy text;
begin
  for r in
    select *
    from (values
      -- comercial
      ('companies',                 array['OWNER','ADMIN','MANAGER','SALES']),
      ('contacts',                  array['OWNER','ADMIN','MANAGER','SALES']),
      ('leads',                     array['OWNER','ADMIN','MANAGER','SALES']),
      ('opportunities',             array['OWNER','ADMIN','MANAGER','SALES']),
      ('opportunity_stage_history', array['OWNER','ADMIN','MANAGER','SALES']),
      ('activities',                array['OWNER','ADMIN','MANAGER','SALES']),
      ('interactions',              array['OWNER','ADMIN','MANAGER','SALES']),
      ('customer_insights',         array['OWNER','ADMIN','MANAGER','SALES']),
      ('daily_briefs',              array['OWNER','ADMIN','MANAGER']),
      -- entrega
      ('pipelines',                 array['OWNER','ADMIN','MANAGER']),
      ('products',                  array['OWNER','ADMIN','MANAGER']),
      ('projects',                  array['OWNER','ADMIN','MANAGER']),
      ('project_services',          array['OWNER','ADMIN','MANAGER']),
      -- financeiro
      ('project_costs',             array['OWNER','ADMIN','FINANCE']),
      ('project_cost_history',      array['OWNER','ADMIN','FINANCE']),
      ('project_usage',             array['OWNER','ADMIN','FINANCE']),
      ('cost_allocations',          array['OWNER','ADMIN','FINANCE']),
      ('revenues',                  array['OWNER','ADMIN','FINANCE']),
      ('organization_expenses',     array['OWNER','ADMIN','FINANCE']),
      ('goals',                     array['OWNER','ADMIN','MANAGER','FINANCE']),
      -- infraestrutura futura (sem uso nesta etapa)
      ('integrations',              array['OWNER','ADMIN']),
      ('external_messages',         array['OWNER','ADMIN']),
      ('ai_agents',                 array['OWNER','ADMIN']),
      ('ai_conversations',          array['OWNER','ADMIN']),
      ('ai_messages',               array['OWNER','ADMIN']),
      ('ai_tasks',                  array['OWNER','ADMIN']),
      ('ai_actions',                array['OWNER','ADMIN'])
    ) as t(table_name, write_roles)
  loop
    execute format('alter table public.%I enable row level security', r.table_name);

    v_select_policy := r.table_name || '_select';

    -- Leitura: qualquer membro ativo da organização dona da linha.
    execute format(
      'create policy %I on public.%I for select to authenticated using (organization_id in (select public.current_user_org_ids()))',
      v_select_policy, r.table_name
    );

    -- Escrita: apenas papéis autorizados, e sempre dentro da própria organização.
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (organization_id in (select public.current_user_org_ids()) and public.has_org_role(organization_id, %L::public.org_role[]))',
      r.table_name || '_insert', r.table_name, r.write_roles
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (organization_id in (select public.current_user_org_ids()) and public.has_org_role(organization_id, %L::public.org_role[])) with check (organization_id in (select public.current_user_org_ids()) and public.has_org_role(organization_id, %L::public.org_role[]))',
      r.table_name || '_update', r.table_name, r.write_roles, r.write_roles
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (organization_id in (select public.current_user_org_ids()) and public.has_org_role(organization_id, %L::public.org_role[]))',
      r.table_name || '_delete', r.table_name, r.write_roles
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------
alter table public.organizations enable row level security;

create policy organizations_select on public.organizations
  for select to authenticated
  using (id in (select public.current_user_org_ids()));

-- Criação só pela função create_organization: no instante do INSERT o
-- usuário ainda não é membro de nada e nenhuma policy poderia liberá-lo.
create policy organizations_update on public.organizations
  for update to authenticated
  using (public.has_org_role(id, array['OWNER', 'ADMIN']::public.org_role[]))
  with check (public.has_org_role(id, array['OWNER', 'ADMIN']::public.org_role[]));

create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.has_org_role(id, array['OWNER']::public.org_role[]));

-- ---------------------------------------------------------------------
-- profiles — o usuário vê a si mesmo e a quem divide organização com ele
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.organization_members m
      where m.user_id = profiles.id
        and m.organization_id in (select public.current_user_org_ids())
    )
  );

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- organization_members — quem administra a organização gerencia o time
-- ---------------------------------------------------------------------
alter table public.organization_members enable row level security;

create policy organization_members_select on public.organization_members
  for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));

create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER', 'ADMIN']::public.org_role[]));

create policy organization_members_update on public.organization_members
  for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER', 'ADMIN']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['OWNER', 'ADMIN']::public.org_role[]));

create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER', 'ADMIN']::public.org_role[]));

-- ---------------------------------------------------------------------
-- pipeline_stages — herda a organização do pipeline
-- ---------------------------------------------------------------------
alter table public.pipeline_stages enable row level security;

create policy pipeline_stages_select on public.pipeline_stages
  for select to authenticated
  using (exists (
    select 1 from public.pipelines p
    where p.id = pipeline_stages.pipeline_id
      and p.organization_id in (select public.current_user_org_ids())
  ));

create policy pipeline_stages_write on public.pipeline_stages
  for all to authenticated
  using (exists (
    select 1 from public.pipelines p
    where p.id = pipeline_stages.pipeline_id
      and public.has_org_role(p.organization_id, array['OWNER', 'ADMIN', 'MANAGER']::public.org_role[])
  ))
  with check (exists (
    select 1 from public.pipelines p
    where p.id = pipeline_stages.pipeline_id
      and public.has_org_role(p.organization_id, array['OWNER', 'ADMIN', 'MANAGER']::public.org_role[])
  ));

-- ---------------------------------------------------------------------
-- notifications — cada um lê as suas (ou as da organização inteira)
-- ---------------------------------------------------------------------
alter table public.notifications enable row level security;

create policy notifications_select on public.notifications
  for select to authenticated
  using (
    organization_id in (select public.current_user_org_ids())
    and (user_id is null or user_id = auth.uid())
  );

create policy notifications_insert on public.notifications
  for insert to authenticated
  with check (organization_id in (select public.current_user_org_ids()));

create policy notifications_update on public.notifications
  for update to authenticated
  using (
    organization_id in (select public.current_user_org_ids())
    and (user_id is null or user_id = auth.uid())
  )
  with check (organization_id in (select public.current_user_org_ids()));

create policy notifications_delete on public.notifications
  for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER', 'ADMIN']::public.org_role[]));

-- ---------------------------------------------------------------------
-- audit_logs — append-only: ninguém edita nem apaga a trilha
-- ---------------------------------------------------------------------
alter table public.audit_logs enable row level security;

create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (
    organization_id in (select public.current_user_org_ids())
    and public.has_org_role(organization_id, array['OWNER', 'ADMIN', 'FINANCE']::public.org_role[])
  );

-- A escrita acontece pelo trigger (SECURITY DEFINER), nunca pelo usuário:
-- por isso não existe policy de INSERT/UPDATE/DELETE aqui.

-- ---------------------------------------------------------------------
-- webhook_events — escrita só pelo backend (service role)
-- ---------------------------------------------------------------------
alter table public.webhook_events enable row level security;

create policy webhook_events_select on public.webhook_events
  for select to authenticated
  using (
    organization_id in (select public.current_user_org_ids())
    and public.has_org_role(organization_id, array['OWNER', 'ADMIN']::public.org_role[])
  );

-- ---------------------------------------------------------------------
-- Conferência: nenhuma tabela de negócio pode ficar sem RLS.
-- A migration falha se alguém adicionar tabela e esquecer a policy.
-- ---------------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  select string_agg(c.relname, ', ')
  into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relrowsecurity;

  if v_missing is not null then
    raise exception 'tabelas sem RLS habilitado: %', v_missing;
  end if;
end;
$$;
