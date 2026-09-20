import type { FastifyInstance } from 'fastify'
import type { z } from 'zod'
import { withUser } from './db.js'
import { notFound } from './errors.js'
import { commonFiltersSchema, paginate, paginationSchema, uuidParam } from './http.js'
import { listRecords, toColumns, type ListOptions } from './query.js'
import type { OrgRole } from '../plugins/auth.js'

export interface ResourceConfig {
  /** Segmento da rota: /api/v1/<path> */
  path: string
  table: string
  singular: string
  createSchema: z.ZodTypeAny
  updateSchema: z.ZodTypeAny
  list: Omit<ListOptions, 'table'>
  writeRoles: OrgRole[]
  /** Exclusão lógica (deleted_at) em vez de DELETE físico. */
  softDelete?: boolean
}

/**
 * Gera o CRUD padrão de um recurso.
 *
 * Todas as rotas rodam dentro de `withUser`, então cada consulta passa
 * pelo RLS. O organization_id nunca vem do corpo da requisição: é sempre
 * o da sessão, o que impede um cliente de gravar em outro tenant mesmo
 * que tente.
 */
export function registerResource(app: FastifyInstance, config: ResourceConfig) {
  const softDelete = config.softDelete !== false
  const base = `/${config.path}`

  app.get(base, { preHandler: app.authenticate }, async (request) => {
    const pagination = paginationSchema.parse(request.query)
    const filters = commonFiltersSchema.passthrough().parse(request.query)

    const result = await withUser({ userId: request.user.id }, (tx) =>
      listRecords(tx, { ...config.list, table: config.table, softDelete }, pagination, filters),
    )

    return paginate(result.rows, result.total, pagination)
  })

  app.get(`${base}/:id`, { preHandler: app.authenticate }, async (request) => {
    const { id } = uuidParam.parse(request.params)

    const row = await withUser({ userId: request.user.id }, async (tx) => {
      const [record] = await tx`select * from ${tx(config.table)} where id = ${id} limit 1`
      return record
    })

    if (!row) throw notFound(config.singular)
    return { data: row }
  })

  app.post(base, { preHandler: app.requireRole(...config.writeRoles) }, async (request, reply) => {
    const payload = config.createSchema.parse(request.body) as Record<string, unknown>
    const values = { ...toColumns(payload), organization_id: request.organizationId }

    const row = await withUser({ userId: request.user.id }, async (tx) => {
      const [record] = await tx`insert into ${tx(config.table)} ${tx(values)} returning *`
      return record
    })

    reply.code(201)
    return { data: row }
  })

  app.patch(`${base}/:id`, { preHandler: app.requireRole(...config.writeRoles) }, async (request) => {
    const { id } = uuidParam.parse(request.params)
    const payload = config.updateSchema.parse(request.body) as Record<string, unknown>
    const values = toColumns(payload)

    if (Object.keys(values).length === 0) {
      throw notFound(config.singular)
    }

    const row = await withUser({ userId: request.user.id }, async (tx) => {
      const [record] = await tx`
        update ${tx(config.table)} set ${tx(values)}
        where id = ${id}
        returning *
      `
      return record
    })

    // Linha inexistente ou barrada pelo RLS respondem igual: 404.
    // Um 403 aqui revelaria que o registro existe em outro tenant.
    if (!row) throw notFound(config.singular)
    return { data: row }
  })

  app.delete(`${base}/:id`, { preHandler: app.requireRole(...config.writeRoles) }, async (request) => {
    const { id } = uuidParam.parse(request.params)

    const row = await withUser({ userId: request.user.id }, async (tx) => {
      if (softDelete) {
        const [record] = await tx`
          update ${tx(config.table)} set deleted_at = now()
          where id = ${id} and deleted_at is null
          returning id
        `
        return record
      }
      const [record] = await tx`delete from ${tx(config.table)} where id = ${id} returning id`
      return record
    })

    if (!row) throw notFound(config.singular)
    return { data: { id, deleted: true } }
  })
}
