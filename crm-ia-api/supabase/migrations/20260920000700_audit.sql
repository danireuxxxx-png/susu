-- =====================================================================
-- 0007 — Auditoria
--
-- Trilha append-only: quem mudou o quê, quando e de onde. Escrita por
-- trigger nas tabelas sensíveis e pela API nos eventos de sessão.
-- =====================================================================

create table public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations (id) on delete cascade,
  actor_id         uuid references public.profiles (id) on delete set null,
  action           public.audit_action not null,
  entity           text not null,
  entity_id        uuid,
  changes          jsonb,
  ip_address       inet,
  user_agent       text,
  created_at       timestamptz not null default now()
);

create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

-- Só guarda o que mudou, não a linha inteira: menos volume e menos
-- dado sensível replicado.
create or replace function public.jsonb_diff(p_old jsonb, p_new jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(
    jsonb_object_agg(
      key,
      jsonb_build_object('from', p_old -> key, 'to', p_new -> key)
    ),
    '{}'::jsonb
  )
  from (
    select key from jsonb_object_keys(coalesce(p_new, '{}'::jsonb)) as key
    union
    select key from jsonb_object_keys(coalesce(p_old, '{}'::jsonb)) as key
  ) keys
  where (p_old -> key) is distinct from (p_new -> key)
    and key not in ('updated_at', 'created_at');
$$;

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_changes jsonb;
  v_action public.audit_action;
  v_entity_id uuid;
begin
  if tg_op = 'INSERT' then
    v_action := 'INSERT';
    v_org := (to_jsonb(new) ->> 'organization_id')::uuid;
    v_entity_id := (to_jsonb(new) ->> 'id')::uuid;
    v_changes := jsonb_build_object('new', to_jsonb(new) - 'created_at' - 'updated_at');
  elsif tg_op = 'UPDATE' then
    v_action := 'UPDATE';
    v_org := (to_jsonb(new) ->> 'organization_id')::uuid;
    v_entity_id := (to_jsonb(new) ->> 'id')::uuid;
    v_changes := public.jsonb_diff(to_jsonb(old), to_jsonb(new));
    if v_changes = '{}'::jsonb then
      return coalesce(new, old);
    end if;
  else
    v_action := 'DELETE';
    v_org := (to_jsonb(old) ->> 'organization_id')::uuid;
    v_entity_id := (to_jsonb(old) ->> 'id')::uuid;
    v_changes := jsonb_build_object('old', to_jsonb(old) - 'created_at' - 'updated_at');
  end if;

  insert into public.audit_logs (organization_id, actor_id, action, entity, entity_id, changes)
  values (v_org, auth.uid(), v_action, tg_table_name, v_entity_id, v_changes);

  return coalesce(new, old);
end;
$$;

comment on function public.audit_trigger is
  'Registra INSERT/UPDATE/DELETE em audit_logs guardando apenas o delta dos campos.';

-- Tabelas sob auditoria: comercial sensível + tudo que afeta dinheiro.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'companies', 'contacts', 'leads', 'opportunities', 'projects',
    'project_services', 'project_costs', 'revenues', 'organization_expenses',
    'products', 'goals', 'organization_members', 'pipelines', 'pipeline_stages',
    'cost_allocations'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_trigger()',
      v_table || '_audit', v_table
    );
  end loop;
end;
$$;
