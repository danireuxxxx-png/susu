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
