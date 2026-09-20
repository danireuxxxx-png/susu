import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { withUser } from '../lib/db.js'
import { referenceSchema } from '../lib/http.js'

const windowSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
})

/**
 * Endpoints do dashboard.
 *
 * Cada rota é uma consulta agregada no Postgres: o frontend recebe o
 * número pronto e não soma nada por conta própria — assim as telas nunca
 * divergem do relatório financeiro.
 */
export const dashboardRoutes = async (app: FastifyInstance) => {
  app.get('/dashboard/summary', { preHandler: app.authenticate }, async (request) => {
    const { reference } = referenceSchema.parse(request.query)

    const data = await withUser({ userId: request.user.id }, async (tx) => {
      const [economics] = await tx<Record<string, string>[]>`
        select * from public.organization_economics_at(coalesce(${reference ?? null}, current_date)::date)
        where organization_id = ${request.organizationId}
      `

      const [commercial] = await tx<Record<string, string>[]>`
        select
          coalesce(sum(value) filter (where won_at is null and lost_at is null), 0) as pipeline_value,
          coalesce(sum(value * probability / 100) filter (where won_at is null and lost_at is null), 0) as weighted_value,
          count(*) filter (where won_at is null and lost_at is null) as open_opportunities,
          count(*) filter (where won_at is not null) as won_opportunities,
          count(*) filter (where lost_at is not null) as lost_opportunities,
          coalesce(avg(value) filter (where won_at is not null), 0) as average_ticket
        from public.opportunities
        where deleted_at is null
      `

      const [leads] = await tx<Record<string, string>[]>`
        select
          count(*) filter (where created_at >= current_date - 30) as last_30,
          count(*) filter (where created_at >= current_date - 60 and created_at < current_date - 30) as previous_30,
          count(*) filter (where status = 'NEW') as new_leads,
          count(*) filter (where status = 'QUALIFIED') as qualified
        from public.leads
        where deleted_at is null
      `

      const [activities] = await tx<Record<string, string>[]>`
        select
          count(*) filter (where status = 'PLANNED' and scheduled_at::date = current_date) as today,
          count(*) filter (where status = 'PLANNED' and scheduled_at < now()) as overdue
        from public.activities
        where deleted_at is null
      `

      return { economics, commercial, leads, activities }
    })

    const { economics = {}, commercial = {}, leads = {}, activities = {} } = data
    const won = Number(commercial.won_opportunities ?? 0)
    const lost = Number(commercial.lost_opportunities ?? 0)
    const closed = won + lost

    return {
      data: {
        revenue: { mrr: Number(economics.mrr ?? 0), arr: Number(economics.arr ?? 0) },
        profit: {
          gross: Number(economics.gross_profit ?? 0),
          grossMargin: Number(economics.gross_margin ?? 0),
          net: Number(economics.net_profit ?? 0),
          netMargin: Number(economics.net_margin ?? 0),
        },
        costs: {
          projects: Number(economics.project_monthly_cost ?? 0),
          operating: Number(economics.operating_monthly_cost ?? 0),
          total: Number(economics.total_monthly_cost ?? 0),
        },
        pipeline: {
          value: Number(commercial.pipeline_value ?? 0),
          weightedValue: Number(commercial.weighted_value ?? 0),
          openOpportunities: Number(commercial.open_opportunities ?? 0),
        },
        conversion: {
          rate: closed === 0 ? 0 : Number(((won / closed) * 100).toFixed(2)),
          won,
          lost,
          averageTicket: Number(Number(commercial.average_ticket ?? 0).toFixed(2)),
        },
        leads: {
          last30Days: Number(leads.last_30 ?? 0),
          previous30Days: Number(leads.previous_30 ?? 0),
          new: Number(leads.new_leads ?? 0),
          qualified: Number(leads.qualified ?? 0),
        },
        customers: {
          active: Number(economics.active_customers ?? 0),
          activeProjects: Number(economics.active_projects ?? 0),
        },
        activities: {
          today: Number(activities.today ?? 0),
          overdue: Number(activities.overdue ?? 0),
        },
      },
    }
  })

  app.get('/dashboard/pipeline', { preHandler: app.authenticate }, async (request) => {
    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select stage_id, stage_name, position, probability, is_won, is_lost,
             opportunities, total_value, weighted_value
      from public.v_pipeline_summary
      where organization_id = ${request.organizationId} or organization_id is null
      order by position
    `)

    return { data: rows }
  })

  app.get('/dashboard/revenue', { preHandler: app.authenticate }, async (request) => {
    const { months } = z.object({ months: z.coerce.number().int().min(1).max(36).default(12) }).parse(request.query)

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select month, billed, paid, pending, recurring, one_time
      from public.v_revenue_monthly
      where month >= date_trunc('month', current_date) - make_interval(months => ${months - 1})
      order by month
    `)

    return { data: rows }
  })

  app.get('/dashboard/profit', { preHandler: app.authenticate }, async (request) => {
    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select project_id, project_name, company_name, monthly_revenue, monthly_cost, monthly_profit, margin
      from public.v_project_economics
      order by monthly_profit desc
    `)

    return { data: rows }
  })

  app.get('/dashboard/leads', { preHandler: app.authenticate }, async (request) => {
    const { days } = windowSchema.parse(request.query)

    const data = await withUser({ userId: request.user.id }, async (tx) => {
      const bySource = await tx`
        select source, count(*)::int as total, coalesce(sum(estimated_value), 0) as value
        from public.leads
        where deleted_at is null and created_at >= current_date - ${days}::int
        group by source
        order by total desc
      `
      const byStatus = await tx`
        select status, count(*)::int as total
        from public.leads
        where deleted_at is null
        group by status
      `
      return { bySource, byStatus }
    })

    return { data }
  })

  app.get('/dashboard/conversion', { preHandler: app.authenticate }, async (request) => {
    const { days } = windowSchema.parse(request.query)

    const data = await withUser({ userId: request.user.id }, async (tx) => {
      const [funnel] = await tx<Record<string, string>[]>`
        select
          count(*) filter (where l.created_at >= current_date - ${days}::int) as leads,
          count(*) filter (where l.status = 'QUALIFIED' and l.created_at >= current_date - ${days}::int) as qualified,
          count(*) filter (where l.status = 'CONVERTED' and l.converted_at >= current_date - ${days}::int) as converted
        from public.leads l
        where l.deleted_at is null
      `
      const [deals] = await tx<Record<string, string>[]>`
        select
          count(*) filter (where won_at >= current_date - ${days}::int) as won,
          count(*) filter (where lost_at >= current_date - ${days}::int) as lost,
          coalesce(sum(value) filter (where won_at >= current_date - ${days}::int), 0) as won_value
        from public.opportunities
        where deleted_at is null
      `
      return { funnel, deals }
    })

    const leads = Number(data.funnel?.leads ?? 0)
    const converted = Number(data.funnel?.converted ?? 0)
    const won = Number(data.deals?.won ?? 0)
    const lost = Number(data.deals?.lost ?? 0)

    return {
      data: {
        windowDays: days,
        leads,
        qualified: Number(data.funnel?.qualified ?? 0),
        converted,
        leadToCustomer: leads === 0 ? 0 : Number(((converted / leads) * 100).toFixed(2)),
        won,
        lost,
        winRate: won + lost === 0 ? 0 : Number(((won / (won + lost)) * 100).toFixed(2)),
        wonValue: Number(data.deals?.won_value ?? 0),
      },
    }
  })

  app.get('/dashboard/activities', { preHandler: app.authenticate }, async (request) => {
    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select a.id, a.title, a.type, a.status, a.scheduled_at, a.duration_minutes,
             a.company_id, c.trade_name as company_name, a.owner_id
      from public.activities a
      left join public.companies c on c.id = a.company_id
      where a.deleted_at is null
        and a.scheduled_at >= current_date
        and a.scheduled_at < current_date + 7
      order by a.scheduled_at
      limit 50
    `)

    return { data: rows }
  })

  app.get('/dashboard/customer-profitability', { preHandler: app.authenticate }, async (request) => {
    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select company_id, company_name, projects_active, monthly_revenue, monthly_cost, monthly_profit, margin
      from public.v_customer_profitability
      order by monthly_profit desc
      limit 20
    `)

    return { data: rows }
  })
}
