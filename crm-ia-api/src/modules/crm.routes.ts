import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { registerResource } from '../lib/resource.js'
import { withUser } from '../lib/db.js'
import { notFound } from '../lib/errors.js'
import { uuidParam } from '../lib/http.js'

const COMMERCIAL_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'SALES'] as const
const DELIVERY_ROLES = ['OWNER', 'ADMIN', 'MANAGER'] as const

const companySchema = z.object({
  tradeName: z.string().trim().min(1).max(160),
  legalName: z.string().trim().max(200).optional(),
  document: z.string().trim().max(32).optional(),
  industry: z.string().trim().max(120).optional(),
  companySize: z.enum(['MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  website: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().email().optional(),
  address: z.string().trim().max(240).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(60).optional(),
  country: z.string().trim().max(2).optional(),
  employees: z.number().int().min(0).optional(),
  ownerId: z.string().uuid().optional(),
  notes: z.string().max(4000).optional(),
})

const contactSchema = z.object({
  companyId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  email: z.string().email().optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(4000).optional(),
})

const leadSchema = z.object({
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  email: z.string().email().optional(),
  phone: z.string().trim().max(40).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  source: z.enum(['WHATSAPP', 'INSTAGRAM', 'REFERRAL', 'WEBSITE', 'OUTBOUND', 'EVENT', 'OTHER']).optional(),
  status: z
    .enum(['NEW', 'CONTACTED', 'QUALIFYING', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST'])
    .optional(),
  temperature: z.enum(['COLD', 'WARM', 'HOT']).optional(),
  estimatedValue: z.number().min(0).optional(),
  ownerId: z.string().uuid().optional(),
  lastContactAt: z.string().datetime().optional(),
  notes: z.string().max(4000).optional(),
})

const opportunitySchema = z.object({
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(4000).optional(),
  value: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  source: z.enum(['WHATSAPP', 'INSTAGRAM', 'REFERRAL', 'WEBSITE', 'OUTBOUND', 'EVENT', 'OTHER']).optional(),
  expectedCloseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nextActionAt: z.string().datetime().optional(),
  nextActionLabel: z.string().max(240).optional(),
})

const pipelineSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).optional(),
  isDefault: z.boolean().optional(),
})

const stageSchema = z.object({
  pipelineId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  position: z.number().int().min(0),
  probability: z.number().min(0).max(100).optional(),
  color: z.string().max(20).optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
})

export const crmRoutes = async (app: FastifyInstance) => {
  registerResource(app, {
    path: 'companies',
    table: 'public.companies',
    singular: 'Empresa',
    createSchema: companySchema,
    updateSchema: companySchema.partial(),
    writeRoles: [...COMMERCIAL_ROLES],
    list: {
      searchColumns: ['trade_name', 'legal_name', 'document', 'city', 'industry'],
      sortable: ['tradeName', 'createdAt', 'city', 'industry'],
      defaultSort: 'created_at',
      filters: { ownerId: 'owner_id', industry: 'industry', companySize: 'company_size' },
      dateColumn: 'created_at',
    },
  })

  registerResource(app, {
    path: 'contacts',
    table: 'public.contacts',
    singular: 'Contato',
    createSchema: contactSchema,
    updateSchema: contactSchema.partial(),
    writeRoles: [...COMMERCIAL_ROLES],
    list: {
      searchColumns: ['name', 'email', 'phone', 'job_title'],
      sortable: ['name', 'createdAt'],
      defaultSort: 'created_at',
      filters: { companyId: 'company_id' },
      dateColumn: 'created_at',
    },
  })

  registerResource(app, {
    path: 'leads',
    table: 'public.leads',
    singular: 'Lead',
    createSchema: leadSchema,
    updateSchema: leadSchema.partial(),
    writeRoles: [...COMMERCIAL_ROLES],
    list: {
      searchColumns: ['name', 'email', 'phone', 'job_title'],
      sortable: ['name', 'createdAt', 'estimatedValue', 'lastContactAt', 'status'],
      defaultSort: 'created_at',
      filters: { status: 'status', source: 'source', ownerId: 'owner_id', companyId: 'company_id' },
      dateColumn: 'created_at',
      valueColumn: 'estimated_value',
    },
  })

  registerResource(app, {
    path: 'opportunities',
    table: 'public.opportunities',
    singular: 'Oportunidade',
    createSchema: opportunitySchema,
    updateSchema: opportunitySchema.partial(),
    writeRoles: [...COMMERCIAL_ROLES],
    list: {
      searchColumns: ['title', 'description'],
      sortable: ['title', 'value', 'createdAt', 'expectedCloseDate', 'probability'],
      defaultSort: 'created_at',
      filters: {
        stageId: 'stage_id',
        pipelineId: 'pipeline_id',
        companyId: 'company_id',
        ownerId: 'owner_id',
        priority: 'priority',
        source: 'source',
      },
      dateColumn: 'expected_close_date',
      valueColumn: 'value',
    },
  })

  registerResource(app, {
    path: 'pipelines',
    table: 'public.pipelines',
    singular: 'Pipeline',
    createSchema: pipelineSchema,
    updateSchema: pipelineSchema.partial(),
    writeRoles: [...DELIVERY_ROLES],
    softDelete: false,
    list: {
      searchColumns: ['name'],
      sortable: ['name', 'createdAt'],
      defaultSort: 'created_at',
      softDelete: false,
    },
  })

  registerResource(app, {
    path: 'pipeline-stages',
    table: 'public.pipeline_stages',
    singular: 'Etapa',
    createSchema: stageSchema,
    updateSchema: stageSchema.partial().omit({ pipelineId: true }),
    writeRoles: [...DELIVERY_ROLES],
    softDelete: false,
    list: {
      searchColumns: ['name'],
      sortable: ['position', 'name'],
      defaultSort: 'position',
      defaultDirection: 'asc',
      filters: { pipelineId: 'pipeline_id' },
      softDelete: false,
    },
  })

  // ---------------------------------------------------------------
  // Operações que atravessam várias tabelas: delegadas às funções do
  // banco, que são transacionais por natureza.
  // ---------------------------------------------------------------
  const convertSchema = z.object({
    pipelineId: z.string().uuid().optional(),
    stageId: z.string().uuid().optional(),
    title: z.string().trim().max(200).optional(),
    value: z.number().min(0).optional(),
    expectedCloseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    ownerId: z.string().uuid().optional(),
  })

  app.post(
    '/leads/:id/convert',
    { preHandler: app.requireRole('OWNER', 'ADMIN', 'MANAGER', 'SALES') },
    async (request, reply) => {
      const { id } = uuidParam.parse(request.params)
      const body = convertSchema.parse(request.body ?? {})

      const opportunity = await withUser({ userId: request.user.id }, async (tx) => {
        const [row] = await tx<{ convert_lead: unknown }[]>`
          select public.convert_lead(
            ${id}::uuid,
            ${body.stageId ?? null}::uuid,
            ${body.pipelineId ?? null}::uuid,
            ${body.title ?? null}::text,
            ${body.value ?? null}::numeric,
            ${body.expectedCloseDate ?? null}::date,
            ${body.ownerId ?? null}::uuid
          ) as convert_lead
        `
        return row?.convert_lead
      })

      reply.code(201)
      return { data: opportunity }
    },
  )

  app.post(
    '/opportunities/:id/stage',
    { preHandler: app.requireRole('OWNER', 'ADMIN', 'MANAGER', 'SALES') },
    async (request) => {
      const { id } = uuidParam.parse(request.params)
      const body = z.object({ stageId: z.string().uuid(), note: z.string().max(500).optional() }).parse(request.body)

      const opportunity = await withUser({ userId: request.user.id }, async (tx) => {
        const [row] = await tx<{ move_opportunity_stage: unknown }[]>`
          select public.move_opportunity_stage(${id}::uuid, ${body.stageId}::uuid, ${body.note ?? null}::text)
            as move_opportunity_stage
        `
        return row?.move_opportunity_stage
      })

      return { data: opportunity }
    },
  )

  app.get('/opportunities/:id/history', { preHandler: app.authenticate }, async (request) => {
    const { id } = uuidParam.parse(request.params)

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select h.*, s.name as to_stage_name, f.name as from_stage_name
      from public.opportunity_stage_history h
      left join public.pipeline_stages s on s.id = h.to_stage_id
      left join public.pipeline_stages f on f.id = h.from_stage_id
      where h.opportunity_id = ${id}
      order by h.created_at desc
    `)

    return { data: rows }
  })

  app.post(
    '/opportunities/:id/project',
    { preHandler: app.requireRole('OWNER', 'ADMIN', 'MANAGER') },
    async (request, reply) => {
      const { id } = uuidParam.parse(request.params)
      const body = z
        .object({
          name: z.string().trim().max(200).optional(),
          monthlyRevenue: z.number().min(0).optional(),
          setupRevenue: z.number().min(0).optional(),
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          status: z.enum(['PROPOSED', 'ONBOARDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
        })
        .parse(request.body ?? {})

      const project = await withUser({ userId: request.user.id }, async (tx) => {
        const [row] = await tx<{ create_project_from_opportunity: unknown }[]>`
          select public.create_project_from_opportunity(
            ${id}::uuid,
            ${body.name ?? null}::text,
            ${body.monthlyRevenue ?? null}::numeric,
            ${body.setupRevenue ?? 0}::numeric,
            ${body.startDate ?? null}::date,
            coalesce(${body.status ?? null}, 'ONBOARDING')::public.project_status
          ) as create_project_from_opportunity
        `
        return row?.create_project_from_opportunity
      })

      if (!project) throw notFound('Oportunidade')
      reply.code(201)
      return { data: project }
    },
  )
}
