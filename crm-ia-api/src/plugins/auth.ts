import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { withUser } from '../lib/db.js'
import { forbidden, unauthorized } from '../lib/errors.js'
import { resolveToken } from '../lib/jwt.js'

export type OrgRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES' | 'FINANCE' | 'VIEWER'

export interface Membership {
  organizationId: string
  role: OrgRole
}

declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string; email?: string }
    memberships: Membership[]
    organizationId: string
    organizationRole: OrgRole
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>
    requireRole: (...roles: OrgRole[]) => (request: FastifyRequest) => Promise<void>
  }
}

function extractToken(request: FastifyRequest): string {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) throw unauthorized()
  const token = header.slice(7).trim()
  if (!token) throw unauthorized()
  return token
}

const authPlugin: FastifyPluginAsync = async (app) => {
  /**
   * Autentica e resolve a organização da requisição.
   *
   * A organização vem do header `x-organization-id`; quando ausente e o
   * usuário pertence a uma só, ela é inferida. O vínculo é sempre lido do
   * banco — nunca do token — para que revogar um acesso tenha efeito
   * imediato, sem esperar o JWT expirar.
   */
  app.decorate('authenticate', async (request: FastifyRequest) => {
    const claims = await resolveToken(extractToken(request))

    const memberships = await withUser({ userId: claims.sub }, async (tx) => {
      const rows = await tx<{ organization_id: string; role: OrgRole }[]>`
        select organization_id, role
        from public.organization_members
        where user_id = ${claims.sub} and status = 'ACTIVE'
        order by created_at
      `
      return rows.map((row) => ({ organizationId: row.organization_id, role: row.role }))
    })

    if (memberships.length === 0) {
      throw forbidden('Usuário sem organização ativa')
    }

    const requested = request.headers['x-organization-id']
    const requestedId = Array.isArray(requested) ? requested[0] : requested

    const membership = requestedId
      ? memberships.find((item) => item.organizationId === requestedId)
      : memberships[0]

    if (!membership) {
      throw forbidden('Você não pertence a esta organização')
    }

    request.user = { id: claims.sub, email: claims.email }
    request.memberships = memberships
    request.organizationId = membership.organizationId
    request.organizationRole = membership.role
  })

  /**
   * Checagem de papel na borda da API.
   *
   * É a primeira barreira, não a única: o RLS repete a verificação no
   * banco. Se esta falhar por um bug, a consulta ainda é barrada lá.
   */
  app.decorate('requireRole', (...roles: OrgRole[]) => {
    return async (request: FastifyRequest) => {
      if (!request.user) await app.authenticate(request)
      if (!roles.includes(request.organizationRole)) {
        throw forbidden(`Esta ação exige um destes papéis: ${roles.join(', ')}`)
      }
    }
  })
}

export default fp(authPlugin, { name: 'auth' })
