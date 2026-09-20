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
