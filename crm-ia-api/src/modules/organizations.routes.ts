import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { withUser } from '../lib/db.js'
import { forbidden, notFound } from '../lib/errors.js'
import { uuidParam } from '../lib/http.js'

export const organizationRoutes = async (app: FastifyInstance) => {
  app.get('/organizations/current', { preHandler: app.authenticate }, async (request) => {
    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select * from public.organizations where id = ${request.organizationId}
    `)

    if (!rows[0]) throw notFound('Organização')
    return { data: { ...rows[0], role: request.organizationRole } }
  })

  app.patch(
    '/organizations/current',
    { preHandler: app.requireRole('OWNER', 'ADMIN') },
    async (request) => {
      const body = z
        .object({
          name: z.string().trim().min(1).max(160).optional(),
          legalName: z.string().trim().max(200).optional(),
          document: z.string().trim().max(32).optional(),
          industry: z.string().trim().max(120).optional(),
          logoUrl: z.string().url().optional(),
          currency: z.string().length(3).optional(),
          timezone: z.string().max(60).optional(),
        })
        .parse(request.body)

      const row = await withUser({ userId: request.user.id }, async (tx) => {
        const [record] = await tx`
          update public.organizations set
            name = coalesce(${body.name ?? null}, name),
            legal_name = coalesce(${body.legalName ?? null}, legal_name),
            document = coalesce(${body.document ?? null}, document),
            industry = coalesce(${body.industry ?? null}, industry),
            logo_url = coalesce(${body.logoUrl ?? null}, logo_url),
            currency = coalesce(${body.currency ?? null}, currency),
            timezone = coalesce(${body.timezone ?? null}, timezone)
          where id = ${request.organizationId}
          returning *
        `
        return record
      })

      if (!row) throw notFound('Organização')
      return { data: row }
    },
  )

  app.get('/organizations/current/members', { preHandler: app.authenticate }, async (request) => {
    const rows = await withUser({ userId: request.user.id }, (tx) => tx`
      select m.id, m.role, m.status, m.created_at,
             p.id as user_id, p.name, p.email, p.avatar_url
      from public.organization_members m
      join public.profiles p on p.id = m.user_id
      where m.organization_id = ${request.organizationId}
      order by m.created_at
    `)

    return { data: rows }
  })

  /** Convida um usuário já existente no Supabase Auth para a organização. */
  app.post(
    '/organizations/current/members',
    { preHandler: app.requireRole('OWNER', 'ADMIN') },
    async (request, reply) => {
      const body = z
        .object({
          userId: z.string().uuid(),
          role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'VIEWER']),
        })
        .parse(request.body)

      const row = await withUser({ userId: request.user.id }, async (tx) => {
        const [record] = await tx`
          insert into public.organization_members (organization_id, user_id, role, status, invited_by)
          values (${request.organizationId}, ${body.userId}, ${body.role}, 'ACTIVE', ${request.user.id})
          on conflict (organization_id, user_id)
            do update set role = excluded.role, status = 'ACTIVE'
          returning *
        `
        return record
      })

      await app.recordAudit({
        organizationId: request.organizationId,
        actorId: request.user.id,
        action: 'PERMISSION_CHANGE',
        entity: 'organization_members',
        entityId: row?.id as string,
        changes: { role: body.role, userId: body.userId },
        request,
      })

      reply.code(201)
      return { data: row }
    },
  )

  app.patch(
    '/organizations/current/members/:id',
    { preHandler: app.requireRole('OWNER', 'ADMIN') },
    async (request) => {
      const { id } = uuidParam.parse(request.params)
      const body = z
        .object({
          role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'VIEWER']).optional(),
          status: z.enum(['ACTIVE', 'INVITED', 'SUSPENDED']).optional(),
        })
        .parse(request.body)

      const row = await withUser({ userId: request.user.id }, async (tx) => {
        // Um OWNER não pode rebaixar a si mesmo e deixar a organização sem dono.
        const [target] = await tx<{ user_id: string; role: string }[]>`
          select user_id, role from public.organization_members where id = ${id}
        `
        if (target?.user_id === request.user.id && body.role && body.role !== 'OWNER') {
          const [ownerCount] = await tx<{ owners: string }[]>`
            select count(*)::text as owners from public.organization_members
            where organization_id = ${request.organizationId} and role = 'OWNER' and status = 'ACTIVE'
          `
          if (Number(ownerCount?.owners ?? 0) <= 1) {
            throw forbidden('A organização precisa de ao menos um OWNER ativo')
          }
        }

        const [record] = await tx`
          update public.organization_members set
            role = coalesce(${body.role ?? null}, role),
            status = coalesce(${body.status ?? null}, status)
          where id = ${id}
          returning *
        `
        return record
      })

      if (!row) throw notFound('Membro')

      await app.recordAudit({
        organizationId: request.organizationId,
        actorId: request.user.id,
        action: 'PERMISSION_CHANGE',
        entity: 'organization_members',
        entityId: id,
        changes: body,
        request,
      })

      return { data: row }
    },
  )

  app.delete(
    '/organizations/current/members/:id',
    { preHandler: app.requireRole('OWNER', 'ADMIN') },
    async (request) => {
      const { id } = uuidParam.parse(request.params)

      const row = await withUser({ userId: request.user.id }, async (tx) => {
        const [record] = await tx`
          delete from public.organization_members
          where id = ${id} and user_id <> ${request.user.id}
          returning id
        `
        return record
      })

      if (!row) throw notFound('Membro')
      return { data: { id, removed: true } }
    },
  )
}
