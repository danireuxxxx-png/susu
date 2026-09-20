import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { withUser } from '../lib/db.js'
import { referenceSchema } from '../lib/http.js'
import { registerResource } from '../lib/resource.js'

const FINANCE_ROLES = ['OWNER', 'ADMIN', 'FINANCE'] as const

const COST_CATEGORY = [
  'AI_API', 'HOSTING', 'VPS', 'DATABASE', 'STORAGE', 'DOMAIN', 'EMAIL', 'WHATSAPP_API', 'SMS',
  'AUTOMATION', 'THIRD_PARTY_API', 'SOFTWARE', 'INFRASTRUCTURE', 'SUPPORT', 'HUMAN_RESOURCE',
  'MARKETING', 'OTHER',
] as const
const BILLING_PERIOD = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME'] as const

const revenueSchema = z.object({
  companyId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  description: z.string().trim().min(1).max(240),
  amount: z.number().min(0),
  type: z.enum(['SETUP', 'MONTHLY', 'ANNUAL', 'ONE_TIME', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  competenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
})

const expenseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).optional(),
  category: z.enum(COST_CATEGORY).optional(),
  provider: z.string().max(120).optional(),
  costType: z.enum(['FIXED', 'VARIABLE', 'USAGE_BASED']).optional(),
  amount: z.number().min(0),
  billingPeriod: z.enum(BILLING_PERIOD).optional(),
  recurring: z.boolean().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(2000).optional(),
})

const allocationSchema = z.object({
  organizationExpenseId: z.string().uuid().optional(),
  projectCostId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  allocationType: z.enum(['FIXED', 'PERCENTAGE', 'USAGE']).optional(),
  allocationValue: z.number().min(0),
  notes: z.string().max(1000).optional(),
})

const profitabilityQuery = referenceSchema.extend({
  orderBy: z.enum(['revenue', 'cost', 'profit', 'margin', 'name']).default('profit'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const financialRoutes = async (app: FastifyInstance) => {
  registerResource(app, {
    path: 'revenues',
    table: 'public.revenues',
    singular: 'Receita',
    createSchema: revenueSchema,
    updateSchema: revenueSchema.partial(),
    writeRoles: [...FINANCE_ROLES],
    list: {
      searchColumns: ['description', 'notes'],
      sortable: ['competenceDate', 'amount', 'dueDate', 'status', 'createdAt'],
      defaultSort: 'competence_date',
      filters: { status: 'status', type: 'type', companyId: 'company_id', projectId: 'project_id' },
      dateColumn: 'competence_date',
      valueColumn: 'amount',
    },
  })

  registerResource(app, {
    path: 'expenses',
    table: 'public.organization_expenses',
    singular: 'Despesa',
    createSchema: expenseSchema,
    updateSchema: expenseSchema.partial(),
    writeRoles: [...FINANCE_ROLES],
    list: {
      searchColumns: ['name', 'provider', 'description'],
      sortable: ['name', 'amount', 'createdAt', 'category'],
      defaultSort: 'created_at',
      filters: { category: 'category', provider: 'provider', costType: 'cost_type' },
      dateColumn: 'start_date',
      valueColumn: 'amount',
    },
  })

  registerResource(app, {
    path: 'cost-allocations',
    table: 'public.cost_allocations',
    singular: 'Rateio',
    createSchema: allocationSchema,
    updateSchema: allocationSchema.partial(),
    writeRoles: [...FINANCE_ROLES],
    softDelete: false,
    list: {
      sortable: ['createdAt', 'allocationValue'],
      defaultSort: 'created_at',
      filters: { projectId: 'project_id', companyId: 'company_id' },
      softDelete: false,
    },
  })

  // -----------------------------------------------------------------
  // Relatórios — todos lidos das views, com o RLS do usuário aplicado
  // -----------------------------------------------------------------

  /** Panorama: MRR, ARR, custos, lucro bruto e líquido. */
  app.get('/financial/summary', { preHandler: app.authenticate }, async (request) => {
    const { reference } = referenceSchema.parse(request.query)

    const data = await withUser({ userId: request.user.id }, async (tx) => {
      const [economics] = await tx<Record<string, string>[]>`
        select * from public.organization_economics_at(coalesce(${reference ?? null}, current_date)::date)
        where organization_id = ${request.organizationId}
      `

      const [billed] = await tx<Record<string, string>[]>`
        select
          coalesce(sum(amount) filter (where status <> 'CANCELLED'), 0) as billed,
          coalesce(sum(amount) filter (where status = 'PAID'), 0) as paid,
          coalesce(sum(amount) filter (where status = 'PENDING'), 0) as pending,
          coalesce(sum(amount) filter (where status = 'OVERDUE'), 0) as overdue,
          coalesce(sum(amount) filter (where type in ('MONTHLY','ANNUAL') and status <> 'CANCELLED'), 0) as recurring,
          coalesce(sum(amount) filter (where type not in ('MONTHLY','ANNUAL') and status <> 'CANCELLED'), 0) as one_time
        from public.revenues
        where deleted_at is null
          and date_trunc('month', competence_date) = date_trunc('month', coalesce(${reference ?? null}, current_date)::date)
      `

      return { economics, billed }
    })

    const economics = data.economics ?? {}
    const billed = data.billed ?? {}

    return {
      data: {
        reference: reference ?? new Date().toISOString().slice(0, 10),
        recurring: {
          mrr: Number(economics.mrr ?? 0),
          arr: Number(economics.arr ?? 0),
        },
        costs: {
          projects: Number(economics.project_monthly_cost ?? 0),
          operating: Number(economics.operating_monthly_cost ?? 0),
          total: Number(economics.total_monthly_cost ?? 0),
        },
        profit: {
          gross: Number(economics.gross_profit ?? 0),
          grossMargin: Number(economics.gross_margin ?? 0),
          net: Number(economics.net_profit ?? 0),
          netMargin: Number(economics.net_margin ?? 0),
        },
        billing: {
          billed: Number(billed.billed ?? 0),
          paid: Number(billed.paid ?? 0),
          pending: Number(billed.pending ?? 0),
          overdue: Number(billed.overdue ?? 0),
          recurring: Number(billed.recurring ?? 0),
          oneTime: Number(billed.one_time ?? 0),
        },
        portfolio: {
          activeProjects: Number(economics.active_projects ?? 0),
          activeCustomers: Number(economics.active_customers ?? 0),
        },
      },
    }
  })

  /** Série mensal de receita faturada, recorrente e pontual. */
  app.get('/financial/revenue', { preHandler: app.authenticate }, async (request) => {
    const { months } = z.object({ months: z.coerce.number().int().min(1).max(36).default(12) }).parse(request.query)

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select month, billed, paid, pending, overdue, recurring, one_time
      from public.v_revenue_monthly
      where month >= date_trunc('month', current_date) - make_interval(months => ${months - 1})
      order by month
    `)

    return { data: rows }
  })

  /** Série mensal de MRR, custo e lucro — o gráfico inteiro em uma consulta. */
  app.get('/financial/history', { preHandler: app.authenticate }, async (request) => {
    const { months } = z.object({ months: z.coerce.number().int().min(1).max(36).default(12) }).parse(request.query)

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select * from public.organization_economics_series(${request.organizationId}::uuid, ${months}::int)
    `)

    return { data: rows }
  })

  /** Receita por dia, para os recortes curtos do dashboard. */
  app.get('/financial/revenue-daily', { preHandler: app.authenticate }, async (request) => {
    const { days } = z.object({ days: z.coerce.number().int().min(1).max(365).default(90) }).parse(request.query)

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select * from public.revenue_daily_series(${request.organizationId}::uuid, ${days}::int)
    `)

    return { data: rows }
  })

  /** Custos do mês em uma base única (projeto + operação). */
  app.get('/financial/expenses', { preHandler: app.authenticate }, async (request) => {
    const { reference } = referenceSchema.parse(request.query)

    const data = await withUser({ userId: request.user.id }, async (tx) => {
      const lines = await tx`
        select scope, name, category, provider, cost_type, monthly_amount, project_id, company_id
        from public.cost_lines_at(coalesce(${reference ?? null}, current_date)::date)
        order by monthly_amount desc
      `
      const byCategory = await tx`
        select category, scope, entries, monthly_amount from public.v_cost_by_category
        order by monthly_amount desc
      `
      const byProvider = await tx`
        select provider, entries, monthly_amount from public.v_cost_by_provider
        order by monthly_amount desc
      `
      return { lines, byCategory, byProvider }
    })

    return { data }
  })

  /** Lucro e margem consolidados. */
  app.get('/financial/profit', { preHandler: app.authenticate }, async (request) => {
    const { reference } = referenceSchema.parse(request.query)

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select mrr as revenue, project_monthly_cost, operating_monthly_cost, total_monthly_cost,
             gross_profit, gross_margin, net_profit, net_margin
      from public.organization_economics_at(coalesce(${reference ?? null}, current_date)::date)
      where organization_id = ${request.organizationId}
    `)

    return { data: rows[0] ?? null }
  })

  /** Margem por projeto — ordenável pelo cliente. */
  app.get('/financial/margins', { preHandler: app.authenticate }, async (request) => {
    const { reference } = referenceSchema.parse(request.query)

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select project_id, project_name, company_id, company_name, status,
             monthly_revenue, monthly_cost, monthly_profit, margin
      from public.project_economics_at(coalesce(${reference ?? null}, current_date)::date)
      order by margin asc
    `)

    return { data: rows }
  })

  app.get('/financial/mrr', { preHandler: app.authenticate }, async (request) => {
    const data = await withUser({ userId: request.user.id }, async (tx) => {
      const [totals] = await tx<Record<string, string>[]>`
        select mrr, arr from public.v_organization_economics
        where organization_id = ${request.organizationId}
      `
      const byCustomer = await tx`
        select company_id, company_name, monthly_revenue as mrr
        from public.v_company_economics
        where monthly_revenue > 0
        order by monthly_revenue desc
      `
      return { totals, byCustomer }
    })

    return {
      data: {
        mrr: Number(data.totals?.mrr ?? 0),
        arr: Number(data.totals?.arr ?? 0),
        byCustomer: data.byCustomer,
      },
    }
  })

  app.get('/financial/arr', { preHandler: app.authenticate }, async (request) => {
    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select arr, mrr from public.v_organization_economics
      where organization_id = ${request.organizationId}
    `)

    return { data: { arr: Number(rows[0]?.arr ?? 0), mrr: Number(rows[0]?.mrr ?? 0) } }
  })

  /** Tabela cliente × receita × custo × lucro × margem. */
  app.get('/financial/customer-profitability', { preHandler: app.authenticate }, async (request) => {
    const query = profitabilityQuery.parse(request.query)

    const orderColumn = {
      revenue: 'monthly_revenue',
      cost: 'monthly_cost',
      profit: 'monthly_profit',
      margin: 'margin',
      name: 'company_name',
    }[query.orderBy]

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select company_id, company_name, projects_total, projects_active,
             monthly_revenue, monthly_cost, monthly_profit, margin,
             annual_revenue, annual_cost, annual_profit
      from public.company_economics_at(coalesce(${query.reference ?? null}, current_date)::date)
      where projects_total > 0
      order by ${tx(orderColumn)} ${query.direction === 'asc' ? tx`asc` : tx`desc`}
      limit ${query.limit}
    `)

    return { data: rows }
  })

  /** Gera as mensalidades da competência (idempotente). */
  app.post(
    '/financial/generate-monthly-revenues',
    { preHandler: app.requireRole('OWNER', 'ADMIN', 'FINANCE') },
    async (request) => {
      const { competence } = z
        .object({ competence: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })
        .parse(request.body ?? {})

      const inserted = await withUser({ userId: request.user.id }, async (tx) => {
        const [row] = await tx<{ generate_monthly_revenues: number }[]>`
          select public.generate_monthly_revenues(
            ${request.organizationId}::uuid,
            coalesce(${competence ?? null}, date_trunc('month', current_date)::date)::date
          ) as generate_monthly_revenues
        `
        return row?.generate_monthly_revenues ?? 0
      })

      return { data: { created: inserted } }
    },
  )
}
