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
