-- =====================================================================
-- IA.centrism CRM — instalação do banco
--
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em Run.
-- São 14 migrations aplicadas de uma vez, dentro de UMA transação:
-- ou tudo entra, ou nada entra. Leva alguns segundos.
--
-- Rodar duas vezes não estraga nada: a segunda vez para no aviso logo
-- abaixo, sem alterar uma linha.
-- =====================================================================

begin;

do $instalacao$
begin
  if to_regclass('public.organizations') is not null then
    raise exception 'O banco já está instalado — nada foi alterado.';
  end if;
end;
$instalacao$;

-- ────────────────────────────────────────────────────────────────────
-- 20260920000100_init_types_and_helpers
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0001 — Tipos, domínios e helpers compartilhados
--
-- Convenções do schema:
--   * toda tabela de negócio carrega organization_id (multi-tenant);
--   * dinheiro é numeric(14,2) — nunca float;
--   * datas de auditoria são timestamptz;
--   * exclusão lógica via deleted_at em entidades de histórico.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Papéis e acesso
-- ---------------------------------------------------------------------
create type public.org_role as enum ('OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'VIEWER');
create type public.member_status as enum ('ACTIVE', 'INVITED', 'SUSPENDED');

-- ---------------------------------------------------------------------
-- CRM
-- ---------------------------------------------------------------------
create type public.company_size as enum ('MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');
create type public.lead_status as enum (
  'NEW', 'CONTACTED', 'QUALIFYING', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST'
);
create type public.lead_temperature as enum ('COLD', 'WARM', 'HOT');
create type public.lead_source as enum (
  'WHATSAPP', 'INSTAGRAM', 'REFERRAL', 'WEBSITE', 'OUTBOUND', 'EVENT', 'OTHER'
);
create type public.priority_level as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- ---------------------------------------------------------------------
-- Entrega
-- ---------------------------------------------------------------------
create type public.project_status as enum (
  'PROPOSED', 'ONBOARDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'
);
create type public.product_category as enum (
  'AI_AGENT', 'AUTOMATION', 'CRM', 'CHATBOT', 'INTEGRATION',
  'CUSTOM_DEV', 'SAAS', 'CONSULTING', 'SUPPORT', 'OTHER'
);
create type public.billing_type as enum ('ONE_TIME', 'MONTHLY', 'YEARLY', 'USAGE_BASED');

-- ---------------------------------------------------------------------
-- Custos e receitas
-- ---------------------------------------------------------------------
create type public.billing_period as enum (
  'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME'
);
create type public.cost_type as enum ('FIXED', 'VARIABLE', 'USAGE_BASED');
create type public.cost_category as enum (
  'AI_API', 'HOSTING', 'VPS', 'DATABASE', 'STORAGE', 'DOMAIN', 'EMAIL',
  'WHATSAPP_API', 'SMS', 'AUTOMATION', 'THIRD_PARTY_API', 'SOFTWARE',
  'INFRASTRUCTURE', 'SUPPORT', 'HUMAN_RESOURCE', 'MARKETING', 'OTHER'
);
create type public.allocation_type as enum ('FIXED', 'PERCENTAGE', 'USAGE');
create type public.revenue_type as enum ('SETUP', 'MONTHLY', 'ANNUAL', 'ONE_TIME', 'OTHER');
create type public.revenue_status as enum ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- ---------------------------------------------------------------------
-- Engajamento e gestão
-- ---------------------------------------------------------------------
create type public.activity_type as enum (
  'CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'TASK', 'NOTE'
);
create type public.activity_status as enum ('PLANNED', 'DONE', 'CANCELLED');
create type public.interaction_channel as enum (
  'WHATSAPP', 'EMAIL', 'PHONE', 'MEETING', 'CHAT', 'FORM', 'OTHER'
);
create type public.interaction_direction as enum ('INBOUND', 'OUTBOUND');
create type public.insight_source as enum ('MANUAL', 'IMPORT', 'AI');
create type public.goal_type as enum (
  'REVENUE', 'NEW_CLIENTS', 'MEETINGS', 'PROPOSALS', 'CONVERSIONS',
  'PIPELINE', 'PROFIT', 'MARGIN', 'MRR'
);
create type public.goal_period as enum ('MONTHLY', 'QUARTERLY', 'YEARLY');
create type public.notification_tone as enum ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');
create type public.audit_action as enum (
  'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
  'PERMISSION_CHANGE', 'STAGE_CHANGE', 'FINANCIAL_CHANGE'
);

-- ---------------------------------------------------------------------
-- Helpers genéricos
-- ---------------------------------------------------------------------

-- Mantém updated_at coerente sem depender da aplicação.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Trigger BEFORE UPDATE: carimba updated_at. Usado por todas as tabelas com esse campo.';

-- Converte qualquer valor recorrente para a base mensal.
-- ONE_TIME devolve 0: custo/receita pontual não compõe recorrência.
create or replace function public.to_monthly_amount(p_amount numeric, p_period public.billing_period)
returns numeric
language sql
immutable
as $$
  select case p_period
    when 'DAILY'      then coalesce(p_amount, 0) * 365 / 12
    when 'WEEKLY'     then coalesce(p_amount, 0) * 52 / 12
    when 'MONTHLY'    then coalesce(p_amount, 0)
    when 'QUARTERLY'  then coalesce(p_amount, 0) / 3
    when 'SEMIANNUAL' then coalesce(p_amount, 0) / 6
    when 'YEARLY'     then coalesce(p_amount, 0) / 12
    when 'ONE_TIME'   then 0
    else 0
  end;
$$;

comment on function public.to_monthly_amount is
  'Normaliza um valor recorrente para a base mensal. ONE_TIME = 0 (não é recorrência).';

-- Um registro com janela de vigência está ativo no mês de referência?
create or replace function public.is_active_in_month(p_start date, p_end date, p_reference date)
returns boolean
language sql
immutable
as $$
  select coalesce(p_start, '-infinity'::date) <= (date_trunc('month', p_reference) + interval '1 month - 1 day')::date
     and (p_end is null or p_end >= date_trunc('month', p_reference)::date);
$$;

comment on function public.is_active_in_month is
  'Vigência: o período [start, end] intersecta o mês de referência?';

-- Margem percentual com divisão protegida.
create or replace function public.safe_margin(p_profit numeric, p_revenue numeric)
returns numeric
language sql
immutable
as $$
  select case
    when coalesce(p_revenue, 0) = 0 then 0
    else round((coalesce(p_profit, 0) / p_revenue) * 100, 2)
  end;
$$;

comment on function public.safe_margin is
  'Margem % = lucro / receita * 100, devolvendo 0 quando não há receita.';

-- ────────────────────────────────────────────────────────────────────
-- 20260920000200_tenancy
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0002 — Tenancy: organizações, perfis, membros e helpers de RLS
--
-- Cadeia de identidade:
--   auth.users → profiles → organization_members → organizations
-- =====================================================================

create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(btrim(name)) > 0),
  legal_name    text,
  document      text,
  logo_url      text,
  industry      text,
  timezone      text not null default 'America/Sao_Paulo',
  currency      char(3) not null default 'BRL',
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.organizations is 'Tenant raiz. Toda informação de negócio pertence a uma organização.';

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  email       text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Dados de perfil do usuário autenticado. 1:1 com auth.users.';

create table public.organization_members (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  role             public.org_role not null default 'SALES',
  status           public.member_status not null default 'ACTIVE',
  invited_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

comment on table public.organization_members is
  'Vínculo usuário ↔ organização com papel. É a fonte de verdade do isolamento multi-tenant.';

create index organization_members_user_idx on public.organization_members (user_id, status);
create index organization_members_org_idx on public.organization_members (organization_id, status);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Helpers de tenancy
--
-- São SECURITY DEFINER de propósito: as policies de organization_members
-- consultariam a própria tabela, o que geraria recursão infinita. O
-- search_path é fixado para impedir sequestro de resolução de nomes.
-- ---------------------------------------------------------------------

create or replace function public.current_user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.organization_id
  from public.organization_members m
  where m.user_id = auth.uid()
    and m.status = 'ACTIVE';
$$;

comment on function public.current_user_org_ids is
  'Organizações ativas do usuário autenticado. Base de todas as policies de RLS.';

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

create or replace function public.has_org_role(p_organization_id uuid, p_roles public.org_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.role = any (p_roles)
  );
$$;

comment on function public.has_org_role is
  'O usuário autenticado tem algum dos papéis informados na organização?';

create or replace function public.current_user_role(p_organization_id uuid)
returns public.org_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.role
  from public.organization_members m
  where m.organization_id = p_organization_id
    and m.user_id = auth.uid()
    and m.status = 'ACTIVE'
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- Provisionamento
-- ---------------------------------------------------------------------

-- Cria o profile assim que o usuário nasce no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if exists (select 1 from pg_class where relname = 'users' and relnamespace = 'auth'::regnamespace) then
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;

-- Cria organização + vínculo OWNER em uma transação só.
-- SECURITY DEFINER porque no instante da criação o usuário ainda não é
-- membro de nada — nenhuma policy de INSERT conseguiria autorizá-lo.
create or replace function public.create_organization(
  p_name text,
  p_legal_name text default null,
  p_document text default null,
  p_industry text default null,
  p_currency char(3) default 'BRL',
  p_timezone text default 'America/Sao_Paulo'
)
returns public.organizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_org public.organizations;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if coalesce(btrim(p_name), '') = '' then
    raise exception 'organization name is required' using errcode = '22023';
  end if;

  insert into public.organizations (name, legal_name, document, industry, currency, timezone)
  values (btrim(p_name), p_legal_name, p_document, p_industry, coalesce(p_currency, 'BRL'), coalesce(p_timezone, 'America/Sao_Paulo'))
  returning * into v_org;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_org.id, v_user_id, 'OWNER', 'ACTIVE');

  return v_org;
end;
$$;

comment on function public.create_organization is
  'Cria a organização e vincula quem chamou como OWNER, atomicamente.';

-- ────────────────────────────────────────────────────────────────────
-- 20260920000300_crm
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0003 — CRM: empresas, contatos, leads, pipeline e oportunidades
-- =====================================================================

create table public.companies (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  legal_name       text,
  trade_name       text not null check (length(btrim(trade_name)) > 0),
  document         text,
  industry         text,
  company_size     public.company_size,
  website          text,
  phone            text,
  email            text,
  address          text,
  city             text,
  state            text,
  country          text not null default 'BR',
  employees        integer check (employees is null or employees >= 0),
  owner_id         uuid references public.profiles (id) on delete set null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

comment on table public.companies is 'Empresas atendidas: prospects e clientes. Cliente = empresa com projeto ativo.';

create index companies_org_idx on public.companies (organization_id) where deleted_at is null;
create index companies_org_created_idx on public.companies (organization_id, created_at desc);
create index companies_owner_idx on public.companies (owner_id);
create unique index companies_document_unique on public.companies (organization_id, document)
  where document is not null and deleted_at is null;

create table public.contacts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete set null,
  name             text not null check (length(btrim(name)) > 0),
  email            text,
  phone            text,
  whatsapp         text,
  job_title        text,
  is_primary       boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index contacts_org_idx on public.contacts (organization_id) where deleted_at is null;
create index contacts_company_idx on public.contacts (company_id) where deleted_at is null;
-- Um único contato principal por empresa.
create unique index contacts_primary_unique on public.contacts (company_id)
  where is_primary and deleted_at is null;

create table public.pipelines (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null,
  description      text,
  is_default       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index pipelines_default_unique on public.pipelines (organization_id) where is_default;
create index pipelines_org_idx on public.pipelines (organization_id);

create table public.pipeline_stages (
  id           uuid primary key default gen_random_uuid(),
  pipeline_id  uuid not null references public.pipelines (id) on delete cascade,
  name         text not null,
  position     integer not null check (position >= 0),
  probability  numeric(5, 2) not null default 0 check (probability between 0 and 100),
  color        text,
  is_won       boolean not null default false,
  is_lost      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint pipeline_stages_outcome_exclusive check (not (is_won and is_lost)),
  unique (pipeline_id, position)
);

comment on column public.pipeline_stages.position is
  'Ordem no funil. "order" é palavra reservada em SQL, por isso o nome position.';

create index pipeline_stages_pipeline_idx on public.pipeline_stages (pipeline_id, position);

create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete set null,
  contact_id       uuid references public.contacts (id) on delete set null,
  name             text not null check (length(btrim(name)) > 0),
  email            text,
  phone            text,
  job_title        text,
  source           public.lead_source not null default 'OTHER',
  status           public.lead_status not null default 'NEW',
  temperature      public.lead_temperature not null default 'COLD',
  estimated_value  numeric(14, 2) not null default 0 check (estimated_value >= 0),
  currency         char(3) not null default 'BRL',
  owner_id         uuid references public.profiles (id) on delete set null,
  last_contact_at  timestamptz,
  converted_at     timestamptz,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index leads_org_status_idx on public.leads (organization_id, status) where deleted_at is null;
create index leads_org_created_idx on public.leads (organization_id, created_at desc);
create index leads_owner_idx on public.leads (owner_id) where deleted_at is null;
create index leads_company_idx on public.leads (company_id);
create index leads_source_idx on public.leads (organization_id, source);

create table public.opportunities (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id) on delete cascade,
  pipeline_id          uuid not null references public.pipelines (id) on delete restrict,
  stage_id             uuid not null references public.pipeline_stages (id) on delete restrict,
  company_id           uuid references public.companies (id) on delete set null,
  contact_id           uuid references public.contacts (id) on delete set null,
  lead_id              uuid references public.leads (id) on delete set null,
  owner_id             uuid references public.profiles (id) on delete set null,
  title                text not null check (length(btrim(title)) > 0),
  description          text,
  value                numeric(14, 2) not null default 0 check (value >= 0),
  currency             char(3) not null default 'BRL',
  probability          numeric(5, 2) not null default 0 check (probability between 0 and 100),
  priority             public.priority_level not null default 'MEDIUM',
  source               public.lead_source,
  expected_close_date  date,
  next_action_at       timestamptz,
  next_action_label    text,
  last_interaction_at  timestamptz,
  won_at               timestamptz,
  lost_at              timestamptz,
  lost_reason          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  constraint opportunities_outcome_exclusive check (won_at is null or lost_at is null)
);

comment on table public.opportunities is 'Negócio em andamento. Ao ser ganho, origina um ou mais projetos.';

create index opportunities_org_stage_idx on public.opportunities (organization_id, stage_id) where deleted_at is null;
create index opportunities_org_created_idx on public.opportunities (organization_id, created_at desc);
create index opportunities_company_idx on public.opportunities (company_id) where deleted_at is null;
create index opportunities_owner_idx on public.opportunities (owner_id) where deleted_at is null;
create index opportunities_close_idx on public.opportunities (organization_id, expected_close_date);
create index opportunities_open_idx on public.opportunities (organization_id)
  where deleted_at is null and won_at is null and lost_at is null;

create table public.opportunity_stage_history (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  from_stage_id   uuid references public.pipeline_stages (id) on delete set null,
  to_stage_id     uuid not null references public.pipeline_stages (id) on delete restrict,
  changed_by      uuid references public.profiles (id) on delete set null,
  note            text,
  created_at      timestamptz not null default now()
);

comment on table public.opportunity_stage_history is
  'Trilha de movimentação no funil — alimenta tempo por etapa e auditoria comercial.';

create index opportunity_stage_history_opp_idx on public.opportunity_stage_history (opportunity_id, created_at desc);

create trigger companies_set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();
create trigger pipelines_set_updated_at before update on public.pipelines
  for each row execute function public.set_updated_at();
create trigger pipeline_stages_set_updated_at before update on public.pipeline_stages
  for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
create trigger opportunities_set_updated_at before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 20260920000400_delivery_and_costs
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0004 — Entrega e custos: produtos, projetos, serviços e custos
--
-- Cadeia de unit economics:
--   Venda (opportunity) → Projeto → Serviços vendidos → Custos → Lucro
-- =====================================================================

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null check (length(btrim(name)) > 0),
  description      text,
  category         public.product_category not null default 'OTHER',
  default_price    numeric(14, 2) not null default 0 check (default_price >= 0),
  billing_type     public.billing_type not null default 'MONTHLY',
  currency         char(3) not null default 'BRL',
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.products is 'Catálogo do que a empresa vende (agente de IA, automação, consultoria...).';

create index products_org_idx on public.products (organization_id) where is_active;

create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid not null references public.companies (id) on delete restrict,
  opportunity_id   uuid references public.opportunities (id) on delete set null,
  owner_id         uuid references public.profiles (id) on delete set null,
  name             text not null check (length(btrim(name)) > 0),
  description      text,
  status           public.project_status not null default 'PROPOSED',
  start_date       date,
  end_date         date,
  monthly_revenue  numeric(14, 2) not null default 0 check (monthly_revenue >= 0),
  setup_revenue    numeric(14, 2) not null default 0 check (setup_revenue >= 0),
  currency         char(3) not null default 'BRL',
  notes            text,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint projects_dates_order check (end_date is null or start_date is null or end_date >= start_date)
);

comment on table public.projects is
  'O que foi vendido e está sendo entregue/mantido. É a unidade de rentabilidade do negócio.';
comment on column public.projects.monthly_revenue is
  'Receita recorrente contratada. Só entra no MRR enquanto o projeto estiver ACTIVE.';
comment on column public.projects.setup_revenue is
  'Implantação (one-time). Não entra no MRR — é registrada em revenues como SETUP.';

create index projects_org_status_idx on public.projects (organization_id, status) where deleted_at is null;
create index projects_company_idx on public.projects (company_id) where deleted_at is null;
create index projects_opportunity_idx on public.projects (opportunity_id);
create index projects_active_idx on public.projects (organization_id)
  where status = 'ACTIVE' and deleted_at is null;

create table public.project_services (
  id            uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  name          text not null,
  description   text,
  quantity      numeric(12, 2) not null default 1 check (quantity > 0),
  price         numeric(14, 2) not null default 0 check (price >= 0),
  billing_type  public.billing_type not null default 'MONTHLY',
  currency      char(3) not null default 'BRL',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.project_services is
  'Composição do que o cliente comprou dentro do projeto. Detalha projects.monthly_revenue.';

create index project_services_project_idx on public.project_services (project_id);
create index project_services_org_idx on public.project_services (organization_id);

-- ---------------------------------------------------------------------
-- Custos de projeto — o coração da pergunta "quanto custa manter isso?"
-- ---------------------------------------------------------------------
create table public.project_costs (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references public.organizations (id) on delete cascade,
  project_id             uuid not null references public.projects (id) on delete cascade,
  company_id             uuid references public.companies (id) on delete set null,

  name                   text not null check (length(btrim(name)) > 0),
  description            text,
  category               public.cost_category not null default 'OTHER',
  provider               text,

  cost_type              public.cost_type not null default 'FIXED',

  amount                 numeric(14, 2) not null default 0 check (amount >= 0),
  currency               char(3) not null default 'BRL',
  billing_period         public.billing_period not null default 'MONTHLY',

  usage_based            boolean not null default false,
  unit_cost              numeric(14, 6),
  usage_quantity         numeric(14, 2),
  usage_unit             text,

  estimated_monthly_cost numeric(14, 2) check (estimated_monthly_cost is null or estimated_monthly_cost >= 0),
  actual_monthly_cost    numeric(14, 2) check (actual_monthly_cost is null or actual_monthly_cost >= 0),

  start_date             date not null default current_date,
  end_date               date,

  -- Preparado para importar custos direto do provedor no futuro.
  external_account_id    text,
  external_resource_id   text,
  metadata               jsonb not null default '{}'::jsonb,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz,
  constraint project_costs_dates_order check (end_date is null or end_date >= start_date)
);

comment on table public.project_costs is
  'Custo recorrente ou pontual atribuído a um projeto (OpenAI, VPS, WhatsApp API, storage...).';
comment on column public.project_costs.actual_monthly_cost is
  'Custo real apurado no mês. Tem precedência sobre o estimado e sobre o valor normalizado.';
comment on column public.project_costs.estimated_monthly_cost is
  'Estimativa mensal, usada principalmente em custos por consumo antes da apuração.';

create index project_costs_project_idx on public.project_costs (project_id) where deleted_at is null;
create index project_costs_org_idx on public.project_costs (organization_id) where deleted_at is null;
create index project_costs_company_idx on public.project_costs (company_id) where deleted_at is null;
create index project_costs_category_idx on public.project_costs (organization_id, category) where deleted_at is null;
create index project_costs_provider_idx on public.project_costs (organization_id, provider) where deleted_at is null;
create index project_costs_window_idx on public.project_costs (organization_id, start_date, end_date);

-- Histórico: nenhuma mudança de valor de custo se perde.
create table public.project_cost_history (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id) on delete cascade,
  project_cost_id      uuid not null references public.project_costs (id) on delete cascade,
  previous_amount      numeric(14, 2),
  new_amount           numeric(14, 2),
  previous_monthly_cost numeric(14, 2),
  new_monthly_cost     numeric(14, 2),
  reason               text,
  changed_by           uuid references public.profiles (id) on delete set null,
  changed_at           timestamptz not null default now()
);

create index project_cost_history_cost_idx on public.project_cost_history (project_cost_id, changed_at desc);

-- Consumo (tokens, minutos, requisições). Alimentado manualmente por ora.
create table public.project_usage (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  project_id       uuid not null references public.projects (id) on delete cascade,
  project_cost_id  uuid references public.project_costs (id) on delete set null,
  provider         text,
  period_start     date not null,
  period_end       date not null,
  requests         bigint,
  input_tokens     bigint,
  output_tokens    bigint,
  audio_minutes    numeric(12, 2),
  images_processed bigint,
  messages         bigint,
  unit_cost        numeric(14, 6),
  total_cost       numeric(14, 2),
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  constraint project_usage_period_order check (period_end >= period_start)
);

comment on table public.project_usage is
  'Consumo por período para custos USAGE_BASED. Hoje manual; preparado para importação automática.';

create index project_usage_project_idx on public.project_usage (project_id, period_start desc);

-- Rateio de custos compartilhados (uma VPS para vários clientes).
create table public.cost_allocations (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  organization_expense_id uuid,
  project_cost_id       uuid references public.project_costs (id) on delete cascade,
  project_id            uuid references public.projects (id) on delete cascade,
  company_id            uuid references public.companies (id) on delete cascade,
  allocation_type       public.allocation_type not null default 'PERCENTAGE',
  allocation_value      numeric(14, 4) not null check (allocation_value >= 0),
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint cost_allocations_target check (project_id is not null or company_id is not null),
  constraint cost_allocations_source check (project_cost_id is not null or organization_expense_id is not null)
);

comment on table public.cost_allocations is
  'Estrutura de rateio de custos compartilhados. O algoritmo de distribuição fica na aplicação.';

create index cost_allocations_org_idx on public.cost_allocations (organization_id);
create index cost_allocations_project_idx on public.cost_allocations (project_id);

create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger project_services_set_updated_at before update on public.project_services
  for each row execute function public.set_updated_at();
create trigger project_costs_set_updated_at before update on public.project_costs
  for each row execute function public.set_updated_at();
create trigger cost_allocations_set_updated_at before update on public.cost_allocations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Custo mensal efetivo de uma linha de custo.
-- Precedência: real apurado > estimado > valor normalizado pelo período.
-- ---------------------------------------------------------------------
create or replace function public.project_cost_monthly(c public.project_costs)
returns numeric
language sql
immutable
as $$
  select round(
    coalesce(
      c.actual_monthly_cost,
      c.estimated_monthly_cost,
      case
        when c.usage_based and c.unit_cost is not null and c.usage_quantity is not null
          then c.unit_cost * c.usage_quantity
        else public.to_monthly_amount(c.amount, c.billing_period)
      end
    ),
    2
  );
$$;

comment on function public.project_cost_monthly is
  'Custo mensal efetivo de uma linha: real > estimado > (unit_cost × consumo) > valor normalizado.';

-- Guarda o histórico sempre que o valor efetivo de um custo muda.
create or replace function public.track_project_cost_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old numeric := public.project_cost_monthly(old);
  v_new numeric := public.project_cost_monthly(new);
begin
  if v_old is distinct from v_new or old.amount is distinct from new.amount then
    insert into public.project_cost_history (
      organization_id, project_cost_id, previous_amount, new_amount,
      previous_monthly_cost, new_monthly_cost, changed_by
    )
    values (new.organization_id, new.id, old.amount, new.amount, v_old, v_new, auth.uid());
  end if;
  return new;
end;
$$;

create trigger project_costs_track_changes
  after update on public.project_costs
  for each row execute function public.track_project_cost_change();

-- ────────────────────────────────────────────────────────────────────
-- 20260920000500_finance
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0005 — Financeiro: receitas faturadas e despesas da operação
--
-- Duas fontes de verdade, propositalmente separadas:
--   * projects.monthly_revenue → receita recorrente CONTRATADA (MRR)
--   * revenues                 → o que foi FATURADO/RECEBIDO (caixa)
-- Misturar as duas é o erro clássico; os relatórios tratam cada uma no
-- seu papel.
-- =====================================================================

create table public.revenues (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete set null,
  project_id       uuid references public.projects (id) on delete set null,
  opportunity_id   uuid references public.opportunities (id) on delete set null,
  description      text not null,
  amount           numeric(14, 2) not null check (amount >= 0),
  currency         char(3) not null default 'BRL',
  type             public.revenue_type not null default 'MONTHLY',
  status           public.revenue_status not null default 'PENDING',
  competence_date  date not null default current_date,
  due_date         date,
  paid_at          timestamptz,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint revenues_paid_consistency check (status <> 'PAID' or paid_at is not null)
);

comment on column public.revenues.competence_date is
  'Mês de competência da receita — é por ele que os relatórios agregam, não pela data de pagamento.';

create index revenues_org_competence_idx on public.revenues (organization_id, competence_date desc) where deleted_at is null;
create index revenues_org_status_idx on public.revenues (organization_id, status) where deleted_at is null;
create index revenues_company_idx on public.revenues (company_id) where deleted_at is null;
create index revenues_project_idx on public.revenues (project_id) where deleted_at is null;
create index revenues_due_idx on public.revenues (organization_id, due_date) where status = 'PENDING' and deleted_at is null;

create table public.organization_expenses (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null check (length(btrim(name)) > 0),
  description      text,
  category         public.cost_category not null default 'OTHER',
  provider         text,
  cost_type        public.cost_type not null default 'FIXED',
  amount           numeric(14, 2) not null default 0 check (amount >= 0),
  currency         char(3) not null default 'BRL',
  billing_period   public.billing_period not null default 'MONTHLY',
  recurring        boolean not null default true,
  start_date       date not null default current_date,
  end_date         date,
  expense_date     date,
  external_account_id text,
  metadata         jsonb not null default '{}'::jsonb,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint organization_expenses_dates_order check (end_date is null or end_date >= start_date)
);

comment on table public.organization_expenses is
  'Custo da operação que não pertence a um cliente específico (equipe, escritório, ferramentas internas).';

create index organization_expenses_org_idx on public.organization_expenses (organization_id) where deleted_at is null;
create index organization_expenses_category_idx on public.organization_expenses (organization_id, category) where deleted_at is null;
create index organization_expenses_provider_idx on public.organization_expenses (organization_id, provider) where deleted_at is null;

alter table public.cost_allocations
  add constraint cost_allocations_expense_fk
  foreign key (organization_expense_id) references public.organization_expenses (id) on delete cascade;

create or replace function public.organization_expense_monthly(e public.organization_expenses)
returns numeric
language sql
immutable
as $$
  select round(
    case
      when not e.recurring then 0
      else public.to_monthly_amount(e.amount, e.billing_period)
    end,
    2
  );
$$;

comment on function public.organization_expense_monthly is
  'Despesa mensal normalizada. Despesa não recorrente não compõe o custo fixo mensal.';

create trigger revenues_set_updated_at before update on public.revenues
  for each row execute function public.set_updated_at();
create trigger organization_expenses_set_updated_at before update on public.organization_expenses
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 20260920000600_engagement
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0006 — Engajamento e gestão: atividades, interações, insights,
--        metas, notificações e briefings diários
-- =====================================================================

create table public.activities (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete set null,
  contact_id       uuid references public.contacts (id) on delete set null,
  lead_id          uuid references public.leads (id) on delete set null,
  opportunity_id   uuid references public.opportunities (id) on delete set null,
  project_id       uuid references public.projects (id) on delete set null,
  owner_id         uuid references public.profiles (id) on delete set null,
  type             public.activity_type not null default 'TASK',
  status           public.activity_status not null default 'PLANNED',
  title            text not null check (length(btrim(title)) > 0),
  notes            text,
  scheduled_at     timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint activities_done_consistency check (status <> 'DONE' or completed_at is not null)
);

create index activities_org_scheduled_idx on public.activities (organization_id, scheduled_at) where deleted_at is null;
create index activities_owner_idx on public.activities (owner_id, status) where deleted_at is null;
create index activities_opportunity_idx on public.activities (opportunity_id) where deleted_at is null;
create index activities_company_idx on public.activities (company_id) where deleted_at is null;
create index activities_pending_idx on public.activities (organization_id, scheduled_at)
  where status = 'PLANNED' and deleted_at is null;

create table public.interactions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete set null,
  contact_id       uuid references public.contacts (id) on delete set null,
  lead_id          uuid references public.leads (id) on delete set null,
  opportunity_id   uuid references public.opportunities (id) on delete set null,
  channel          public.interaction_channel not null default 'OTHER',
  direction        public.interaction_direction not null default 'INBOUND',
  content          text,
  metadata         jsonb not null default '{}'::jsonb,
  external_id      text,
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

comment on table public.interactions is
  'Histórico bruto de comunicação. Preparada para receber mensagens do WhatsApp no futuro.';

create index interactions_org_occurred_idx on public.interactions (organization_id, occurred_at desc);
create index interactions_company_idx on public.interactions (company_id, occurred_at desc);
create unique index interactions_external_unique on public.interactions (organization_id, channel, external_id)
  where external_id is not null;

create table public.customer_insights (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete cascade,
  contact_id       uuid references public.contacts (id) on delete cascade,
  key              text not null,
  value            text,
  source           public.insight_source not null default 'MANUAL',
  confidence       numeric(5, 2) check (confidence is null or confidence between 0 and 100),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint customer_insights_target check (company_id is not null or contact_id is not null)
);

comment on table public.customer_insights is
  'Perfil estruturado do cliente (orçamento, dores, urgência). Hoje manual; a coluna source já prevê IA.';

create index customer_insights_company_idx on public.customer_insights (company_id, key);

create table public.goals (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  owner_id         uuid references public.profiles (id) on delete set null,
  type             public.goal_type not null,
  label            text not null,
  description      text,
  period           public.goal_period not null default 'MONTHLY',
  period_start     date not null,
  period_end       date not null,
  target_value     numeric(14, 2) not null check (target_value >= 0),
  currency         char(3) not null default 'BRL',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint goals_period_order check (period_end >= period_start)
);

comment on column public.goals.target_value is
  'Apenas o alvo. O realizado é sempre calculado a partir dos dados, nunca gravado aqui.';

create index goals_org_period_idx on public.goals (organization_id, period_start desc);

create table public.notifications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid references public.profiles (id) on delete cascade,
  title            text not null,
  description      text,
  tone             public.notification_tone not null default 'INFO',
  entity           text,
  entity_id        uuid,
  href             text,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

comment on column public.notifications.user_id is
  'Nulo = notificação da organização inteira; preenchido = destinada a um usuário.';

create index notifications_org_created_idx on public.notifications (organization_id, created_at desc);
create index notifications_unread_idx on public.notifications (organization_id, user_id) where read_at is null;

create table public.daily_briefs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  brief_date       date not null,
  summary          text,
  metrics          jsonb not null default '{}'::jsonb,
  insights         jsonb not null default '[]'::jsonb,
  priorities       jsonb not null default '[]'::jsonb,
  tasks            jsonb not null default '[]'::jsonb,
  generated_by     text not null default 'SYSTEM',
  created_at       timestamptz not null default now(),
  unique (organization_id, brief_date)
);

comment on table public.daily_briefs is
  'Jornal matinal. A estrutura existe; a geração automática por agente virá depois.';

create index daily_briefs_org_date_idx on public.daily_briefs (organization_id, brief_date desc);

create trigger activities_set_updated_at before update on public.activities
  for each row execute function public.set_updated_at();
create trigger customer_insights_set_updated_at before update on public.customer_insights
  for each row execute function public.set_updated_at();
create trigger goals_set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 20260920000700_audit
-- ────────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────────
-- 20260920000800_future_integrations
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0008 — Infraestrutura preparada (SEM implementação)
--
-- As tabelas abaixo existem para que agentes de IA, WhatsApp e coleta
-- automática de custos possam ser ligados depois sem migração de dados.
-- Nenhuma rota da API escreve nelas nesta etapa.
-- =====================================================================

create table public.integrations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  provider         text not null,
  kind             text not null default 'GENERIC',
  status           text not null default 'DISCONNECTED',
  external_account_id text,
  config           jsonb not null default '{}'::jsonb,
  -- Credenciais NUNCA em texto puro: guardar somente a referência a um
  -- secret manager (Supabase Vault, AWS Secrets Manager...).
  credentials_ref  text,
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, provider, kind)
);

comment on column public.integrations.credentials_ref is
  'Referência a um secret externo. Nenhuma chave de API é persistida no banco.';

create table public.webhook_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations (id) on delete cascade,
  integration_id   uuid references public.integrations (id) on delete set null,
  provider         text not null,
  event_type       text,
  external_id      text,
  payload          jsonb not null default '{}'::jsonb,
  signature_valid  boolean,
  processed_at     timestamptz,
  error            text,
  received_at      timestamptz not null default now()
);

create index webhook_events_pending_idx on public.webhook_events (provider, received_at) where processed_at is null;
create unique index webhook_events_external_unique on public.webhook_events (provider, external_id)
  where external_id is not null;

create table public.external_messages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  integration_id   uuid references public.integrations (id) on delete set null,
  interaction_id   uuid references public.interactions (id) on delete set null,
  channel          public.interaction_channel not null default 'WHATSAPP',
  direction        public.interaction_direction not null default 'INBOUND',
  external_id      text,
  from_identifier  text,
  to_identifier    text,
  content          text,
  metadata         jsonb not null default '{}'::jsonb,
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index external_messages_org_idx on public.external_messages (organization_id, occurred_at desc);

-- --------------------------------------------------------------
-- Agentes de IA — estrutura apenas. Nenhuma chamada a LLM existe
-- neste backend.
-- --------------------------------------------------------------
create table public.ai_agents (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  key              text not null,
  name             text not null,
  description      text,
  status           text not null default 'DISABLED',
  config           jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, key)
);

create table public.ai_conversations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  agent_id         uuid references public.ai_agents (id) on delete set null,
  company_id       uuid references public.companies (id) on delete set null,
  contact_id       uuid references public.contacts (id) on delete set null,
  lead_id          uuid references public.leads (id) on delete set null,
  channel          public.interaction_channel not null default 'WHATSAPP',
  status           text not null default 'OPEN',
  metadata         jsonb not null default '{}'::jsonb,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz
);

create table public.ai_messages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  conversation_id  uuid not null references public.ai_conversations (id) on delete cascade,
  role             text not null,
  content          text,
  tokens_input     integer,
  tokens_output    integer,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

create table public.ai_tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  agent_id         uuid references public.ai_agents (id) on delete set null,
  kind             text not null,
  status           text not null default 'PENDING',
  payload          jsonb not null default '{}'::jsonb,
  result           jsonb,
  error            text,
  scheduled_for    timestamptz,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_at       timestamptz not null default now()
);

create index ai_tasks_pending_idx on public.ai_tasks (status, scheduled_for) where status = 'PENDING';

create table public.ai_actions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  task_id          uuid references public.ai_tasks (id) on delete cascade,
  entity           text not null,
  entity_id        uuid,
  action           text not null,
  payload          jsonb not null default '{}'::jsonb,
  applied_at       timestamptz,
  approved_by      uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);

comment on table public.ai_actions is
  'Ações propostas por um agente. O campo approved_by existe para manter humano no circuito.';

create trigger integrations_set_updated_at before update on public.integrations
  for each row execute function public.set_updated_at();
create trigger ai_agents_set_updated_at before update on public.ai_agents
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 20260920000900_economics
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0009 — Unit economics: custo, lucro e margem por projeto e por cliente
--
-- Regras oficiais de cálculo (a aplicação NUNCA recalcula por fora):
--
--   receita recorrente = soma de monthly_revenue dos projetos ACTIVE
--   custo direto       = soma dos custos do projeto vigentes no mês
--   custo alocado      = rateio de despesas da organização (opcional)
--   lucro              = receita - (custo direto + custo alocado)
--   margem             = lucro / receita * 100   (0 quando não há receita)
--
-- Receita pontual (setup) NÃO entra na recorrência: ela vive em
-- revenues e aparece nos relatórios de caixa.
--
-- SEGURANÇA: toda view é security_invoker. Sem isso, uma view roda com
-- os privilégios do dono e ignora o RLS das tabelas de origem — furo
-- clássico de multi-tenant.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Rateio de despesas da organização para projetos.
-- USAGE fica em 0: depende de consumo apurado, ainda não implementado.
-- ---------------------------------------------------------------------
create or replace function public.project_allocated_costs_at(p_reference date default current_date)
returns table (project_id uuid, allocated_monthly_cost numeric)
language sql
stable
as $$
  select
    a.project_id,
    round(sum(
      case a.allocation_type
        when 'FIXED'      then a.allocation_value
        when 'PERCENTAGE' then public.organization_expense_monthly(e) * a.allocation_value / 100
        else 0
      end
    ), 2) as allocated_monthly_cost
  from public.cost_allocations a
  join public.organization_expenses e on e.id = a.organization_expense_id
  where a.project_id is not null
    and e.deleted_at is null
    and public.is_active_in_month(e.start_date, e.end_date, p_reference)
  group by a.project_id;
$$;

-- ---------------------------------------------------------------------
-- Economia de cada projeto em um mês de referência
-- ---------------------------------------------------------------------
create or replace function public.project_economics_at(p_reference date default current_date)
returns table (
  project_id             uuid,
  organization_id        uuid,
  company_id             uuid,
  company_name           text,
  project_name           text,
  status                 public.project_status,
  currency               char(3),
  monthly_revenue        numeric,
  setup_revenue          numeric,
  direct_monthly_cost    numeric,
  allocated_monthly_cost numeric,
  monthly_cost           numeric,
  monthly_profit         numeric,
  margin                 numeric,
  annual_revenue         numeric,
  annual_cost            numeric,
  annual_profit          numeric,
  cost_entries           bigint
)
language sql
stable
as $$
  with direct_costs as (
    select
      pc.project_id,
      round(sum(public.project_cost_monthly(pc)), 2) as monthly_cost,
      count(*) as cost_entries
    from public.project_costs pc
    where pc.deleted_at is null
      and public.is_active_in_month(pc.start_date, pc.end_date, p_reference)
    group by pc.project_id
  ),
  allocated as (
    select * from public.project_allocated_costs_at(p_reference)
  ),
  base as (
    select
      p.id,
      p.organization_id,
      p.company_id,
      c.trade_name as company_name,
      p.name as project_name,
      p.status,
      p.currency,
      -- Só projeto ativo gera receita recorrente; custo continua contando
      -- enquanto a linha de custo estiver vigente (onboarding custa antes
      -- de faturar, e isso precisa aparecer).
      case when p.status = 'ACTIVE' then p.monthly_revenue else 0 end as monthly_revenue,
      p.setup_revenue,
      coalesce(d.monthly_cost, 0) as direct_monthly_cost,
      coalesce(a.allocated_monthly_cost, 0) as allocated_monthly_cost,
      coalesce(d.cost_entries, 0) as cost_entries
    from public.projects p
    join public.companies c on c.id = p.company_id
    left join direct_costs d on d.project_id = p.id
    left join allocated a on a.project_id = p.id
    where p.deleted_at is null
      and c.deleted_at is null
  )
  select
    b.id,
    b.organization_id,
    b.company_id,
    b.company_name,
    b.project_name,
    b.status,
    b.currency,
    b.monthly_revenue,
    b.setup_revenue,
    b.direct_monthly_cost,
    b.allocated_monthly_cost,
    round(b.direct_monthly_cost + b.allocated_monthly_cost, 2) as monthly_cost,
    round(b.monthly_revenue - (b.direct_monthly_cost + b.allocated_monthly_cost), 2) as monthly_profit,
    public.safe_margin(
      b.monthly_revenue - (b.direct_monthly_cost + b.allocated_monthly_cost),
      b.monthly_revenue
    ) as margin,
    round(b.monthly_revenue * 12, 2) as annual_revenue,
    round((b.direct_monthly_cost + b.allocated_monthly_cost) * 12, 2) as annual_cost,
    round((b.monthly_revenue - (b.direct_monthly_cost + b.allocated_monthly_cost)) * 12, 2) as annual_profit,
    b.cost_entries
  from base b;
$$;

comment on function public.project_economics_at is
  'Receita, custo, lucro e margem de cada projeto no mês de referência. Respeita RLS.';

create view public.v_project_economics with (security_invoker = true) as
  select * from public.project_economics_at(current_date);

-- ---------------------------------------------------------------------
-- Economia por cliente (empresa)
-- ---------------------------------------------------------------------
create or replace function public.company_economics_at(p_reference date default current_date)
returns table (
  company_id       uuid,
  organization_id  uuid,
  company_name     text,
  currency         char(3),
  projects_total   bigint,
  projects_active  bigint,
  monthly_revenue  numeric,
  monthly_cost     numeric,
  monthly_profit   numeric,
  margin           numeric,
  annual_revenue   numeric,
  annual_cost      numeric,
  annual_profit    numeric
)
language sql
stable
as $$
  with economics as (
    select * from public.project_economics_at(p_reference)
  )
  select
    c.id,
    c.organization_id,
    c.trade_name,
    max(coalesce(e.currency, 'BRL'::char(3))) as currency,
    count(e.project_id) as projects_total,
    count(*) filter (where e.status = 'ACTIVE') as projects_active,
    round(coalesce(sum(e.monthly_revenue), 0), 2) as monthly_revenue,
    round(coalesce(sum(e.monthly_cost), 0), 2) as monthly_cost,
    round(coalesce(sum(e.monthly_profit), 0), 2) as monthly_profit,
    public.safe_margin(coalesce(sum(e.monthly_profit), 0), coalesce(sum(e.monthly_revenue), 0)) as margin,
    round(coalesce(sum(e.monthly_revenue), 0) * 12, 2) as annual_revenue,
    round(coalesce(sum(e.monthly_cost), 0) * 12, 2) as annual_cost,
    round(coalesce(sum(e.monthly_profit), 0) * 12, 2) as annual_profit
  from public.companies c
  left join economics e on e.company_id = c.id
  where c.deleted_at is null
  group by c.id, c.organization_id, c.trade_name;
$$;

comment on function public.company_economics_at is
  'Consolida os projetos de cada cliente: quanto paga, quanto custa e quanto sobra.';

create view public.v_company_economics with (security_invoker = true) as
  select * from public.company_economics_at(current_date);

create view public.v_customer_profitability with (security_invoker = true) as
  select *
  from public.v_company_economics
  where projects_total > 0;

comment on view public.v_customer_profitability is
  'Clientes com projeto, prontos para ordenar por receita, custo, lucro ou margem.';

-- ---------------------------------------------------------------------
-- Custos da operação, por categoria e por fornecedor
-- ---------------------------------------------------------------------
create or replace function public.cost_lines_at(p_reference date default current_date)
returns table (
  organization_id uuid,
  scope           text,
  source_id       uuid,
  project_id      uuid,
  company_id      uuid,
  name            text,
  category        public.cost_category,
  provider        text,
  cost_type       public.cost_type,
  monthly_amount  numeric
)
language sql
stable
as $$
  select
    pc.organization_id,
    'PROJECT'::text,
    pc.id,
    pc.project_id,
    pc.company_id,
    pc.name,
    pc.category,
    pc.provider,
    pc.cost_type,
    public.project_cost_monthly(pc)
  from public.project_costs pc
  where pc.deleted_at is null
    and public.is_active_in_month(pc.start_date, pc.end_date, p_reference)
  union all
  select
    e.organization_id,
    'ORGANIZATION'::text,
    e.id,
    null::uuid,
    null::uuid,
    e.name,
    e.category,
    e.provider,
    e.cost_type,
    public.organization_expense_monthly(e)
  from public.organization_expenses e
  where e.deleted_at is null
    and public.is_active_in_month(e.start_date, e.end_date, p_reference);
$$;

comment on function public.cost_lines_at is
  'Todas as linhas de custo do mês — de projeto e da organização — na mesma base mensal.';

create view public.v_cost_lines with (security_invoker = true) as
  select * from public.cost_lines_at(current_date);

create view public.v_cost_by_category with (security_invoker = true) as
  select
    organization_id,
    category,
    scope,
    count(*) as entries,
    round(sum(monthly_amount), 2) as monthly_amount
  from public.v_cost_lines
  group by organization_id, category, scope;

create view public.v_cost_by_provider with (security_invoker = true) as
  select
    organization_id,
    coalesce(provider, 'Não informado') as provider,
    count(*) as entries,
    round(sum(monthly_amount), 2) as monthly_amount
  from public.v_cost_lines
  group by organization_id, coalesce(provider, 'Não informado');

-- ---------------------------------------------------------------------
-- Visão da organização: MRR, ARR, custo total, lucro e margem
-- ---------------------------------------------------------------------
create or replace function public.organization_economics_at(p_reference date default current_date)
returns table (
  organization_id        uuid,
  mrr                    numeric,
  arr                    numeric,
  project_monthly_cost   numeric,
  operating_monthly_cost numeric,
  total_monthly_cost     numeric,
  gross_profit           numeric,
  gross_margin           numeric,
  net_profit             numeric,
  net_margin             numeric,
  active_projects        bigint,
  active_customers       bigint
)
language sql
stable
as $$
  with economics as (
    select * from public.project_economics_at(p_reference)
  ),
  projects as (
    select
      organization_id,
      round(coalesce(sum(monthly_revenue), 0), 2) as mrr,
      round(coalesce(sum(monthly_cost), 0), 2) as project_cost,
      count(*) filter (where status = 'ACTIVE') as active_projects,
      count(distinct company_id) filter (where status = 'ACTIVE') as active_customers
    from economics
    group by organization_id
  ),
  operating as (
    select
      e.organization_id,
      round(coalesce(sum(public.organization_expense_monthly(e)), 0), 2) as operating_cost
    from public.organization_expenses e
    where e.deleted_at is null
      and public.is_active_in_month(e.start_date, e.end_date, p_reference)
    group by e.organization_id
  ),
  orgs as (
    select o.id from public.organizations o
  )
  select
    orgs.id,
    coalesce(p.mrr, 0),
    round(coalesce(p.mrr, 0) * 12, 2),
    coalesce(p.project_cost, 0),
    coalesce(op.operating_cost, 0),
    round(coalesce(p.project_cost, 0) + coalesce(op.operating_cost, 0), 2),
    round(coalesce(p.mrr, 0) - coalesce(p.project_cost, 0), 2),
    public.safe_margin(coalesce(p.mrr, 0) - coalesce(p.project_cost, 0), coalesce(p.mrr, 0)),
    round(coalesce(p.mrr, 0) - coalesce(p.project_cost, 0) - coalesce(op.operating_cost, 0), 2),
    public.safe_margin(
      coalesce(p.mrr, 0) - coalesce(p.project_cost, 0) - coalesce(op.operating_cost, 0),
      coalesce(p.mrr, 0)
    ),
    coalesce(p.active_projects, 0),
    coalesce(p.active_customers, 0)
  from orgs
  left join projects p on p.organization_id = orgs.id
  left join operating op on op.organization_id = orgs.id;
$$;

comment on function public.organization_economics_at is
  'Lucro bruto = MRR - custo de projetos. Lucro líquido desconta também a operação.';

create view public.v_organization_economics with (security_invoker = true) as
  select * from public.organization_economics_at(current_date);

-- ---------------------------------------------------------------------
-- Receita faturada (caixa) x recorrente
-- ---------------------------------------------------------------------
create view public.v_revenue_monthly with (security_invoker = true) as
  select
    r.organization_id,
    date_trunc('month', r.competence_date)::date as month,
    round(sum(r.amount) filter (where r.status <> 'CANCELLED'), 2) as billed,
    round(coalesce(sum(r.amount) filter (where r.status = 'PAID'), 0), 2) as paid,
    round(coalesce(sum(r.amount) filter (where r.status = 'PENDING'), 0), 2) as pending,
    round(coalesce(sum(r.amount) filter (where r.status = 'OVERDUE'), 0), 2) as overdue,
    round(coalesce(sum(r.amount) filter (where r.type in ('MONTHLY', 'ANNUAL') and r.status <> 'CANCELLED'), 0), 2) as recurring,
    round(coalesce(sum(r.amount) filter (where r.type not in ('MONTHLY', 'ANNUAL') and r.status <> 'CANCELLED'), 0), 2) as one_time
  from public.revenues r
  where r.deleted_at is null
  group by r.organization_id, date_trunc('month', r.competence_date);

-- ---------------------------------------------------------------------
-- Funil
-- ---------------------------------------------------------------------
create view public.v_pipeline_summary with (security_invoker = true) as
  select
    o.organization_id,
    s.pipeline_id,
    s.id as stage_id,
    s.name as stage_name,
    s.position,
    s.probability,
    s.is_won,
    s.is_lost,
    count(o.id) as opportunities,
    round(coalesce(sum(o.value), 0), 2) as total_value,
    round(coalesce(sum(o.value * o.probability / 100), 0), 2) as weighted_value
  from public.pipeline_stages s
  join public.pipelines pl on pl.id = s.pipeline_id
  left join public.opportunities o
    on o.stage_id = s.id and o.deleted_at is null
  group by o.organization_id, s.pipeline_id, s.id, s.name, s.position, s.probability, s.is_won, s.is_lost;

-- ---------------------------------------------------------------------
-- Funções de conveniência exigidas pelo produto
-- ---------------------------------------------------------------------
create or replace function public.calculate_monthly_project_cost(p_project_id uuid, p_reference date default current_date)
returns numeric
language sql
stable
as $$
  select coalesce((select monthly_cost from public.project_economics_at(p_reference) where project_id = p_project_id), 0);
$$;

create or replace function public.calculate_monthly_project_profit(p_project_id uuid, p_reference date default current_date)
returns numeric
language sql
stable
as $$
  select coalesce((select monthly_profit from public.project_economics_at(p_reference) where project_id = p_project_id), 0);
$$;

create or replace function public.calculate_monthly_customer_cost(p_company_id uuid, p_reference date default current_date)
returns numeric
language sql
stable
as $$
  select coalesce((select monthly_cost from public.company_economics_at(p_reference) where company_id = p_company_id), 0);
$$;

-- Payload pronto para a API: economia do cliente com seus projetos.
create or replace function public.customer_profitability(p_company_id uuid, p_reference date default current_date)
returns jsonb
language sql
stable
as $$
  with company as (
    select * from public.company_economics_at(p_reference) where company_id = p_company_id
  ),
  projects as (
    select * from public.project_economics_at(p_reference) where company_id = p_company_id
  )
  select case
    when not exists (select 1 from company) then null
    else jsonb_build_object(
      'company', jsonb_build_object(
        'id', c.company_id,
        'name', c.company_name,
        'currency', c.currency
      ),
      'reference', p_reference,
      'monthly', jsonb_build_object(
        'revenue', c.monthly_revenue,
        'cost', c.monthly_cost,
        'profit', c.monthly_profit,
        'margin', c.margin
      ),
      'annualized', jsonb_build_object(
        'revenue', c.annual_revenue,
        'cost', c.annual_cost,
        'profit', c.annual_profit
      ),
      'projects', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', p.project_id,
            'name', p.project_name,
            'status', p.status,
            'revenue', p.monthly_revenue,
            'cost', p.monthly_cost,
            'directCost', p.direct_monthly_cost,
            'allocatedCost', p.allocated_monthly_cost,
            'profit', p.monthly_profit,
            'margin', p.margin,
            'costEntries', p.cost_entries
          )
          order by p.monthly_cost desc
        )
        from projects p
      ), '[]'::jsonb)
    )
  end
  from company c;
$$;

comment on function public.customer_profitability is
  'Responde "quanto esse cliente paga, custa e dá de lucro" — e qual projeto dele é o mais caro.';

create or replace function public.project_profitability(p_project_id uuid, p_reference date default current_date)
returns jsonb
language sql
stable
as $$
  select case when e.project_id is null then null else jsonb_build_object(
    'projectId', e.project_id,
    'projectName', e.project_name,
    'companyId', e.company_id,
    'companyName', e.company_name,
    'status', e.status,
    'reference', p_reference,
    'monthlyRevenue', e.monthly_revenue,
    'monthlyCost', e.monthly_cost,
    'monthlyProfit', e.monthly_profit,
    'margin', e.margin,
    'annualized', jsonb_build_object(
      'revenue', e.annual_revenue,
      'cost', e.annual_cost,
      'profit', e.annual_profit
    ),
    'costBreakdown', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.source_id,
        'name', l.name,
        'category', l.category,
        'provider', l.provider,
        'costType', l.cost_type,
        'monthlyAmount', l.monthly_amount
      ) order by l.monthly_amount desc)
      from public.cost_lines_at(p_reference) l
      where l.project_id = p_project_id
    ), '[]'::jsonb)
  ) end
  from (select * from public.project_economics_at(p_reference) where project_id = p_project_id) e;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 20260920001000_operations
-- ────────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────────
-- 20260920001100_rls
-- ────────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────────
-- 20260920001200_storage
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0012 — Supabase Storage
--
-- Convenção de caminho: <organization_id>/<recurso>/<arquivo>
-- O primeiro segmento é a organização, e é ele que as policies checam.
--
-- O bloco é condicional para o schema rodar também fora do Supabase
-- (PGlite nos testes, Postgres puro em CI).
-- =====================================================================

do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'schema storage ausente — buckets ignorados neste ambiente';
    return;
  end if;

  -- Públicos: servem imagens exibidas na interface.
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values
    ('organization-logos', 'organization-logos', true, 2097152,
     array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
    ('avatars', 'avatars', true, 2097152,
     array['image/png', 'image/jpeg', 'image/webp'])
  on conflict (id) do nothing;

  -- Privados: contratos, propostas e anexos comerciais.
  insert into storage.buckets (id, name, public, file_size_limit)
  values
    ('documents', 'documents', false, 26214400),
    ('attachments', 'attachments', false, 26214400)
  on conflict (id) do nothing;

  -- Leitura dos buckets privados: só membros da organização dona da pasta.
  execute $p$
    create policy "org members read private files"
      on storage.objects for select to authenticated
      using (
        bucket_id in ('documents', 'attachments')
        and (storage.foldername(name))[1]::uuid in (select public.current_user_org_ids())
      )
  $p$;

  execute $p$
    create policy "org members upload private files"
      on storage.objects for insert to authenticated
      with check (
        bucket_id in ('documents', 'attachments')
        and (storage.foldername(name))[1]::uuid in (select public.current_user_org_ids())
      )
  $p$;

  execute $p$
    create policy "org admins delete private files"
      on storage.objects for delete to authenticated
      using (
        bucket_id in ('documents', 'attachments')
        and public.has_org_role(
          (storage.foldername(name))[1]::uuid,
          array['OWNER', 'ADMIN', 'MANAGER']::public.org_role[]
        )
      )
  $p$;

  -- Imagens públicas: qualquer um lê, só a organização escreve.
  execute $p$
    create policy "org members manage public images"
      on storage.objects for insert to authenticated
      with check (
        bucket_id in ('organization-logos', 'avatars')
        and (storage.foldername(name))[1]::uuid in (select public.current_user_org_ids())
      )
  $p$;

  execute $p$
    create policy "org members update public images"
      on storage.objects for update to authenticated
      using (
        bucket_id in ('organization-logos', 'avatars')
        and (storage.foldername(name))[1]::uuid in (select public.current_user_org_ids())
      )
  $p$;
exception
  when duplicate_object then
    raise notice 'policies de storage já existem — nada a fazer';
end;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 20260920001300_goal_progress
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0013 — Progresso das metas
--
-- A meta guarda apenas o alvo; o realizado é sempre derivado dos dados,
-- para que nenhum número fique desatualizado ou divergente das outras
-- telas.
-- =====================================================================

create or replace function public.goals_with_progress(
  p_organization_id uuid,
  p_reference date default current_date
)
returns table (
  id            uuid,
  type          public.goal_type,
  label         text,
  description   text,
  period        public.goal_period,
  period_start  date,
  period_end    date,
  target_value  numeric,
  current_value numeric,
  progress      numeric
)
language sql
stable
as $$
  with economics as (
    select * from public.organization_economics_at(p_reference)
    where organization_id = p_organization_id
  ),
  base as (
    select
      g.id, g.type, g.label, g.description, g.period, g.period_start, g.period_end, g.target_value,
      case g.type
        -- Receita faturada na competência do período
        when 'REVENUE' then (
          select coalesce(sum(r.amount), 0)
          from public.revenues r
          where r.organization_id = g.organization_id
            and r.deleted_at is null
            and r.status <> 'CANCELLED'
            and r.competence_date between g.period_start and g.period_end
        )
        when 'MRR' then (select coalesce(mrr, 0) from economics)
        when 'PROFIT' then (select coalesce(net_profit, 0) from economics)
        when 'MARGIN' then (select coalesce(gross_margin, 0) from economics)
        -- Projetos que entraram no período
        when 'NEW_CLIENTS' then (
          select count(*)
          from public.projects p
          where p.organization_id = g.organization_id
            and p.deleted_at is null
            and p.start_date between g.period_start and g.period_end
        )
        when 'MEETINGS' then (
          select count(*)
          from public.activities a
          where a.organization_id = g.organization_id
            and a.deleted_at is null
            and a.type = 'MEETING'
            and a.status = 'DONE'
            and a.completed_at::date between g.period_start and g.period_end
        )
        -- Passagens por etapas de proposta em diante
        when 'PROPOSALS' then (
          select count(distinct h.opportunity_id)
          from public.opportunity_stage_history h
          join public.pipeline_stages s on s.id = h.to_stage_id
          where h.organization_id = g.organization_id
            and s.probability >= 70
            and not s.is_lost
            and h.created_at::date between g.period_start and g.period_end
        )
        when 'CONVERSIONS' then (
          select count(*)
          from public.opportunities o
          where o.organization_id = g.organization_id
            and o.deleted_at is null
            and o.won_at::date between g.period_start and g.period_end
        )
        when 'PIPELINE' then (
          select coalesce(sum(o.value), 0)
          from public.opportunities o
          where o.organization_id = g.organization_id
            and o.deleted_at is null
            and o.won_at is null
            and o.lost_at is null
        )
        else 0
      end as current_value
    from public.goals g
    where g.organization_id = p_organization_id
      and p_reference between g.period_start and g.period_end
  )
  select
    b.id, b.type, b.label, b.description, b.period, b.period_start, b.period_end,
    b.target_value,
    round(b.current_value, 2) as current_value,
    case when b.target_value = 0 then 0 else round(b.current_value / b.target_value * 100, 2) end as progress
  from base b
  order by b.type;
$$;

comment on function public.goals_with_progress is
  'Metas do período com o realizado calculado a partir dos dados reais.';

-- ────────────────────────────────────────────────────────────────────
-- 20260920001400_economics_series
-- ────────────────────────────────────────────────────────────────────

-- =====================================================================
-- 0014 — Série histórica da operação
--
-- Receita, custo e lucro mês a mês em uma única consulta: o dashboard
-- precisa de 12 pontos e não deve fazer 12 requisições para montá-los.
-- =====================================================================

create or replace function public.organization_economics_series(
  p_organization_id uuid,
  p_months integer default 12
)
returns table (
  month                  date,
  mrr                    numeric,
  project_monthly_cost   numeric,
  operating_monthly_cost numeric,
  total_monthly_cost     numeric,
  gross_profit           numeric,
  net_profit             numeric,
  net_margin             numeric,
  billed_revenue         numeric,
  paid_revenue           numeric
)
language sql
stable
as $$
  with months as (
    select generate_series(
      date_trunc('month', current_date) - make_interval(months => greatest(p_months, 1) - 1),
      date_trunc('month', current_date),
      interval '1 month'
    )::date as month
  )
  select
    m.month,
    e.mrr,
    e.project_monthly_cost,
    e.operating_monthly_cost,
    e.total_monthly_cost,
    e.gross_profit,
    e.net_profit,
    e.net_margin,
    coalesce(r.billed, 0) as billed_revenue,
    coalesce(r.paid, 0) as paid_revenue
  from months m
  -- A economia é recalculada para cada mês: custos que ainda não existiam
  -- naquela competência simplesmente não entram.
  cross join lateral (
    select * from public.organization_economics_at(m.month)
    where organization_id = p_organization_id
  ) e
  left join lateral (
    select
      coalesce(sum(amount) filter (where status <> 'CANCELLED'), 0) as billed,
      coalesce(sum(amount) filter (where status = 'PAID'), 0) as paid
    from public.revenues
    where organization_id = p_organization_id
      and deleted_at is null
      and date_trunc('month', competence_date) = m.month
  ) r on true
  order by m.month;
$$;

comment on function public.organization_economics_series is
  'MRR, custo, lucro e faturamento mês a mês — uma consulta para o gráfico inteiro.';

-- Receita por dia, para os recortes curtos do dashboard (7/30/90 dias).
create or replace function public.revenue_daily_series(
  p_organization_id uuid,
  p_days integer default 90
)
returns table (day date, billed numeric, paid numeric)
language sql
stable
as $$
  select
    coalesce(r.paid_at::date, r.competence_date) as day,
    round(coalesce(sum(r.amount) filter (where r.status <> 'CANCELLED'), 0), 2) as billed,
    round(coalesce(sum(r.amount) filter (where r.status = 'PAID'), 0), 2) as paid
  from public.revenues r
  where r.organization_id = p_organization_id
    and r.deleted_at is null
    and coalesce(r.paid_at::date, r.competence_date) >= current_date - greatest(p_days, 1)
  group by 1
  order by 1;
$$;

-- ────────────────────────────────────────────────────────────────────
-- Registro das migrations (para o comando npm run migrate saber o que já rodou)
-- ────────────────────────────────────────────────────────────────────

create schema if not exists migrations;
revoke all on schema migrations from anon, authenticated;

create table if not exists migrations.schema_migrations (
  version    text primary key,
  checksum   text not null,
  applied_at timestamptz not null default now()
);

insert into migrations.schema_migrations (version, checksum) values
  ('20260920000100_init_types_and_helpers', '16b66e988e1b50c7'),
  ('20260920000200_tenancy', '3b839fe6b5347b37'),
  ('20260920000300_crm', '24f148162075a811'),
  ('20260920000400_delivery_and_costs', '94b3017c9a270b5f'),
  ('20260920000500_finance', 'ab96cbef422abfd7'),
  ('20260920000600_engagement', 'fe4dd28a4f098656'),
  ('20260920000700_audit', '889091015d924ad1'),
  ('20260920000800_future_integrations', '929adbe24c7b9a64'),
  ('20260920000900_economics', '1b9ea9ebcd48ed69'),
  ('20260920001000_operations', 'ce38973234702175'),
  ('20260920001100_rls', '48f1ee71df6004fe'),
  ('20260920001200_storage', 'e7a00239a8ee6232'),
  ('20260920001300_goal_progress', '942d5e0aa5c42184'),
  ('20260920001400_economics_series', '55a9c4e00ce6f44c')
on conflict (version) do nothing;

commit;

-- Confira o resultado (deve mostrar 34 tabelas, 126 policies e 0 sem RLS):
select
  (select count(*) from pg_tables where schemaname = 'public')  as tabelas,
  (select count(*) from pg_policies where schemaname = 'public') as policies,
  (select count(*) from pg_tables t
     join pg_class c on c.relname = t.tablename and c.relnamespace = 'public'::regnamespace
   where t.schemaname = 'public' and not c.relrowsecurity)       as sem_rls;
