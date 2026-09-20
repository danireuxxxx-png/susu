import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { withUser } from '../lib/db.js'
import { notFound } from '../lib/errors.js'
import { referenceSchema, uuidParam } from '../lib/http.js'
import { registerResource } from '../lib/resource.js'

const DELIVERY_ROLES = ['OWNER', 'ADMIN', 'MANAGER'] as const
const FINANCE_ROLES = ['OWNER', 'ADMIN', 'FINANCE'] as const

const BILLING_TYPE = ['ONE_TIME', 'MONTHLY', 'YEARLY', 'USAGE_BASED'] as const
const BILLING_PERIOD = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME'] as const
const COST_CATEGORY = [
  'AI_API', 'HOSTING', 'VPS', 'DATABASE', 'STORAGE', 'DOMAIN', 'EMAIL', 'WHATSAPP_API', 'SMS',
  'AUTOMATION', 'THIRD_PARTY_API', 'SOFTWARE', 'INFRASTRUCTURE', 'SUPPORT', 'HUMAN_RESOURCE',
  'MARKETING', 'OTHER',
] as const

const productSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).optional(),
  category: z
    .enum(['AI_AGENT', 'AUTOMATION', 'CRM', 'CHATBOT', 'INTEGRATION', 'CUSTOM_DEV', 'SAAS', 'CONSULTING', 'SUPPORT', 'OTHER'])
    .optional(),
  defaultPrice: z.number().min(0).optional(),
  billingType: z.enum(BILLING_TYPE).optional(),
  isActive: z.boolean().optional(),
})

const projectSchema = z.object({
  companyId: z.string().uuid(),
  opportunityId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(4000).optional(),
  status: z.enum(['PROPOSED', 'ONBOARDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  monthlyRevenue: z.number().min(0).optional(),
  setupRevenue: z.number().min(0).optional(),
  notes: z.string().max(4000).optional(),
})

const serviceSchema = z.object({
  projectId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).optional(),
  quantity: z.number().positive().optional(),
  price: z.number().min(0).optional(),
  billingType: z.enum(BILLING_TYPE).optional(),
})

const costSchema = z.object({
  projectId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).optional(),
  category: z.enum(COST_CATEGORY).optional(),
  provider: z.string().trim().max(120).optional(),
  costType: z.enum(['FIXED', 'VARIABLE', 'USAGE_BASED']).optional(),
  amount: z.number().min(0).optional(),
  billingPeriod: z.enum(BILLING_PERIOD).optional(),
  usageBased: z.boolean().optional(),
  unitCost: z.number().min(0).optional(),
  usageQuantity: z.number().min(0).optional(),
  usageUnit: z.string().max(40).optional(),
  estimatedMonthlyCost: z.number().min(0).optional(),
  actualMonthlyCost: z.number().min(0).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  externalAccountId: z.string().max(200).optional(),
  externalResourceId: z.string().max(200).optional(),
})

export const deliveryRoutes = async (app: FastifyInstance) => {
  registerResource(app, {
    path: 'products',
    table: 'public.products',
    singular: 'Produto',
    createSchema: productSchema,
    updateSchema: productSchema.partial(),
    writeRoles: [...DELIVERY_ROLES],
    softDelete: false,
    list: {
      searchColumns: ['name', 'description'],
      sortable: ['name', 'defaultPrice', 'createdAt'],
      defaultSort: 'name',
      filters: { category: 'category', billingType: 'billing_type' },
      softDelete: false,
    },
  })

  registerResource(app, {
    path: 'projects',
    table: 'public.projects',
    singular: 'Projeto',
    createSchema: projectSchema,
    updateSchema: projectSchema.partial().omit({ companyId: true }),
    writeRoles: [...DELIVERY_ROLES],
    list: {
      searchColumns: ['name', 'description'],
      sortable: ['name', 'createdAt', 'monthlyRevenue', 'startDate', 'status'],
      defaultSort: 'created_at',
      filters: { status: 'status', companyId: 'company_id', ownerId: 'owner_id' },
      dateColumn: 'start_date',
      valueColumn: 'monthly_revenue',
    },
  })

  registerResource(app, {
    path: 'project-services',
    table: 'public.project_services',
    singular: 'Serviço do projeto',
    createSchema: serviceSchema,
    updateSchema: serviceSchema.partial().omit({ projectId: true }),
    writeRoles: [...DELIVERY_ROLES],
    softDelete: false,
    list: {
      searchColumns: ['name', 'description'],
      sortable: ['name', 'price', 'createdAt'],
      defaultSort: 'created_at',
      filters: { projectId: 'project_id', productId: 'product_id' },
      softDelete: false,
    },
  })

  registerResource(app, {
    path: 'project-costs',
    table: 'public.project_costs',
    singular: 'Custo do projeto',
    createSchema: costSchema,
    updateSchema: costSchema.partial().omit({ projectId: true }),
    writeRoles: [...FINANCE_ROLES],
    list: {
      searchColumns: ['name', 'provider', 'description'],
      sortable: ['name', 'amount', 'createdAt', 'category', 'provider'],
      defaultSort: 'created_at',
      filters: {
        projectId: 'project_id',
        companyId: 'company_id',
        category: 'category',
        provider: 'provider',
        costType: 'cost_type',
      },
      dateColumn: 'start_date',
      valueColumn: 'amount',
    },
  })

  // -----------------------------------------------------------------
  // Rentabilidade — o cálculo oficial vem do banco, nunca do cliente
  // -----------------------------------------------------------------

  /** Custos do projeto com o total mensal já normalizado. */
  app.get('/projects/:id/costs', { preHandler: app.authenticate }, async (request) => {
    const { id } = uuidParam.parse(request.params)
    const { reference } = referenceSchema.parse(request.query)

    const result = await withUser({ userId: request.user.id }, async (tx) => {
      const [economics] = await tx<Record<string, string>[]>`
        select * from public.project_economics_at(coalesce(${reference ?? null}, current_date)::date)
        where project_id = ${id}
      `
      if (!economics) return null

      const costs = await tx`
        select id, name, description, category, provider, cost_type, amount, currency,
               billing_period, usage_based, estimated_monthly_cost, actual_monthly_cost,
               start_date, end_date,
               public.project_cost_monthly(pc) as monthly_amount
        from public.project_costs pc
        where project_id = ${id} and deleted_at is null
        order by public.project_cost_monthly(pc) desc
      `

      return { economics, costs }
    })

    if (!result) throw notFound('Projeto')

    const { economics, costs } = result
    return {
      data: {
        projectId: id,
        projectName: economics.project_name,
        monthlyRevenue: Number(economics.monthly_revenue),
        monthlyCost: Number(economics.monthly_cost),
        monthlyProfit: Number(economics.monthly_profit),
        margin: Number(economics.margin),
        costs,
      },
    }
  })

  /** Payload de rentabilidade do projeto, com quebra por linha de custo. */
  app.get('/projects/:id/economics', { preHandler: app.authenticate }, async (request) => {
    const { id } = uuidParam.parse(request.params)
    const { reference } = referenceSchema.parse(request.query)

    const data = await withUser({ userId: request.user.id }, async (tx) => {
      const [row] = await tx<{ project_profitability: unknown }[]>`
        select public.project_profitability(${id}::uuid, coalesce(${reference ?? null}, current_date)::date)
          as project_profitability
      `
      return row?.project_profitability ?? null
    })

    if (!data) throw notFound('Projeto')
    return { data }
  })

  /** Consumo declarado (tokens, requisições) de um projeto. */
  app.get('/projects/:id/usage', { preHandler: app.authenticate }, async (request) => {
    const { id } = uuidParam.parse(request.params)

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select * from public.project_usage
      where project_id = ${id}
      order by period_start desc
      limit 24
    `)

    return { data: rows }
  })

  /** "Quanto esse cliente me paga, quanto custa e quanto sobra?" */
  app.get('/companies/:id/economics', { preHandler: app.authenticate }, async (request) => {
    const { id } = uuidParam.parse(request.params)
    const { reference } = referenceSchema.parse(request.query)

    const data = await withUser({ userId: request.user.id }, async (tx) => {
      const [row] = await tx<{ customer_profitability: unknown }[]>`
        select public.customer_profitability(${id}::uuid, coalesce(${reference ?? null}, current_date)::date)
          as customer_profitability
      `
      return row?.customer_profitability ?? null
    })

    if (!data) throw notFound('Empresa')
    return { data }
  })
}
