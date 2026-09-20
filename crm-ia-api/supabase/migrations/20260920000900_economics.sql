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
