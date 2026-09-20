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
