import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { withUser } from '../lib/db.js'
import { commonFiltersSchema, paginate, paginationSchema, referenceSchema, uuidParam } from '../lib/http.js'
import { listRecords } from '../lib/query.js'
import { registerResource } from '../lib/resource.js'

const COMMERCIAL_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'SALES'] as const

const activitySchema = z.object({
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  type: z.enum(['CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'TASK', 'NOTE']).optional(),
  status: z.enum(['PLANNED', 'DONE', 'CANCELLED']).optional(),
  title: z.string().trim().min(1).max(200),
  notes: z.string().max(4000).optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  completedAt: z.string().datetime().optional(),
})

const interactionSchema = z.object({
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  channel: z.enum(['WHATSAPP', 'EMAIL', 'PHONE', 'MEETING', 'CHAT', 'FORM', 'OTHER']).optional(),
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  content: z.string().max(8000).optional(),
  externalId: z.string().max(200).optional(),
  occurredAt: z.string().datetime().optional(),
})

const insightSchema = z.object({
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  key: z.string().trim().min(1).max(80),
  value: z.string().max(2000).optional(),
  source: z.enum(['MANUAL', 'IMPORT', 'AI']).optional(),
  confidence: z.number().min(0).max(100).optional(),
})

const goalSchema = z.object({
  type: z.enum(['REVENUE', 'NEW_CLIENTS', 'MEETINGS', 'PROPOSALS', 'CONVERSIONS', 'PIPELINE', 'PROFIT', 'MARGIN', 'MRR']),
  label: z.string().trim().min(1).max(160),
  description: z.string().max(1000).optional(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetValue: z.number().min(0),
  ownerId: z.string().uuid().optional(),
})

export const engagementRoutes = async (app: FastifyInstance) => {
  registerResource(app, {
    path: 'activities',
    table: 'public.activities',
    singular: 'Atividade',
    createSchema: activitySchema,
    updateSchema: activitySchema.partial(),
    writeRoles: [...COMMERCIAL_ROLES],
    list: {
      searchColumns: ['title', 'notes'],
      sortable: ['scheduledAt', 'createdAt', 'title', 'status'],
      defaultSort: 'scheduled_at',
      filters: {
        status: 'status',
        type: 'type',
        ownerId: 'owner_id',
        companyId: 'company_id',
        opportunityId: 'opportunity_id',
        projectId: 'project_id',
      },
      dateColumn: 'scheduled_at',
    },
  })

  registerResource(app, {
    path: 'interactions',
    table: 'public.interactions',
    singular: 'Interação',
    createSchema: interactionSchema,
    updateSchema: interactionSchema.partial(),
    writeRoles: [...COMMERCIAL_ROLES],
    softDelete: false,
    list: {
      searchColumns: ['content'],
      sortable: ['occurredAt', 'createdAt'],
      defaultSort: 'occurred_at',
      filters: { companyId: 'company_id', contactId: 'contact_id', opportunityId: 'opportunity_id', channel: 'channel' },
      dateColumn: 'occurred_at',
      softDelete: false,
    },
  })

  registerResource(app, {
    path: 'customer-insights',
    table: 'public.customer_insights',
    singular: 'Insight',
    createSchema: insightSchema,
    updateSchema: insightSchema.partial(),
    writeRoles: [...COMMERCIAL_ROLES],
    softDelete: false,
    list: {
      searchColumns: ['key', 'value'],
      sortable: ['key', 'createdAt', 'confidence'],
      defaultSort: 'created_at',
      filters: { companyId: 'company_id', contactId: 'contact_id', source: 'source' },
      softDelete: false,
    },
  })

  registerResource(app, {
    path: 'goals',
    table: 'public.goals',
    singular: 'Meta',
    createSchema: goalSchema,
    updateSchema: goalSchema.partial(),
    writeRoles: ['OWNER', 'ADMIN', 'MANAGER', 'FINANCE'],
    softDelete: false,
    list: {
      searchColumns: ['label', 'description'],
      sortable: ['periodStart', 'targetValue', 'type'],
      defaultSort: 'period_start',
      filters: { type: 'type', period: 'period' },
      softDelete: false,
    },
  })

  /** Metas com o realizado calculado no banco. */
  app.get('/goals/progress', { preHandler: app.authenticate }, async (request) => {
    const { reference } = referenceSchema.parse(request.query)

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select * from public.goals_with_progress(
        ${request.organizationId}::uuid,
        coalesce(${reference ?? null}, current_date)::date
      )
    `)

    return { data: rows }
  })

  // ---------------------------------------------------------------
  // Notificações
  // ---------------------------------------------------------------
  app.get('/notifications', { preHandler: app.authenticate }, async (request) => {
    const pagination = paginationSchema.parse(request.query)
    const filters = commonFiltersSchema.passthrough().parse(request.query)

    const result = await withUser({ userId: request.user.id }, (tx) =>
      listRecords(
        tx,
        {
          table: 'public.notifications',
          sortable: ['createdAt'],
          defaultSort: 'created_at',
          softDelete: false,
        },
        pagination,
        filters,
      ),
    )

    return paginate(result.rows, result.total, pagination)
  })

  app.post('/notifications/:id/read', { preHandler: app.authenticate }, async (request) => {
    const { id } = uuidParam.parse(request.params)

    const row = await withUser({ userId: request.user.id }, async (tx) => {
      const [record] = await tx`
        update public.notifications set read_at = now()
        where id = ${id} and read_at is null
        returning id, read_at
      `
      return record
    })

    return { data: row ?? { id, readAt: null } }
  })

  app.post('/notifications/read-all', { preHandler: app.authenticate }, async (request) => {
    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      update public.notifications set read_at = now()
      where read_at is null and (user_id is null or user_id = ${request.user.id})
      returning id
    `)

    return { data: { updated: rows.length } }
  })

  // ---------------------------------------------------------------
  // Jornal matinal — só leitura e registro manual; o agente vem depois
  // ---------------------------------------------------------------
  app.get('/daily-brief/latest', { preHandler: app.authenticate }, async (request) => {
    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select * from public.daily_briefs
      order by brief_date desc
      limit 1
    `)

    return { data: rows[0] ?? null }
  })

  app.get('/daily-brief', { preHandler: app.authenticate }, async (request) => {
    const pagination = paginationSchema.parse(request.query)

    const result = await withUser({ userId: request.user.id }, (tx) =>
      listRecords(
        tx,
        { table: 'public.daily_briefs', sortable: ['briefDate'], defaultSort: 'brief_date', softDelete: false },
        pagination,
        commonFiltersSchema.parse({}),
      ),
    )

    return paginate(result.rows, result.total, pagination)
  })

  app.get('/daily-brief/:id', { preHandler: app.authenticate }, async (request) => {
    const { id } = uuidParam.parse(request.params)

    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select * from public.daily_briefs where id = ${id} limit 1
    `)

    return { data: rows[0] ?? null }
  })

  // ---------------------------------------------------------------
  // Auditoria
  // ---------------------------------------------------------------
  app.get('/audit-logs', { preHandler: app.requireRole('OWNER', 'ADMIN', 'FINANCE') }, async (request) => {
    const pagination = paginationSchema.parse(request.query)
    const filters = commonFiltersSchema
      .extend({ entity: z.string().optional(), action: z.string().optional() })
      .passthrough()
      .parse(request.query)

    const result = await withUser({ userId: request.user.id }, (tx) =>
      listRecords(
        tx,
        {
          table: 'public.audit_logs',
          sortable: ['createdAt'],
          defaultSort: 'created_at',
          filters: { entity: 'entity', action: 'action', actorId: 'actor_id' },
          dateColumn: 'created_at',
          softDelete: false,
        },
        pagination,
        filters,
      ),
    )

    return paginate(result.rows, result.total, pagination)
  })
}
