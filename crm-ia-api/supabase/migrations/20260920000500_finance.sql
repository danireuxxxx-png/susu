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
