import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { withServiceRole } from '../lib/db.js'

export interface AuditEntry {
  organizationId?: string
  actorId?: string
  action: 'LOGIN' | 'LOGOUT' | 'PERMISSION_CHANGE' | 'FINANCIAL_CHANGE' | 'STAGE_CHANGE'
  entity: string
  entityId?: string
  changes?: Record<string, unknown>
  request?: FastifyRequest
}

declare module 'fastify' {
  interface FastifyInstance {
    recordAudit: (entry: AuditEntry) => Promise<void>
  }
}

/**
 * Auditoria dos eventos que não passam por INSERT/UPDATE de tabela
 * (login, logout, troca de permissão). As mudanças de dados já são
 * registradas por trigger no banco.
 */
const auditPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('recordAudit', async (entry: AuditEntry) => {
    try {
      const ip = entry.request?.ip ?? null
      const userAgent = entry.request?.headers['user-agent'] ?? null

      await withServiceRole(async (tx) => {
        await tx`
          insert into public.audit_logs (organization_id, actor_id, action, entity, entity_id, changes, ip_address, user_agent)
          values (
            ${entry.organizationId ?? null},
            ${entry.actorId ?? null},
            ${entry.action},
            ${entry.entity},
            ${entry.entityId ?? null},
            ${entry.changes ? JSON.stringify(entry.changes) : null}::jsonb,
            ${ip}::inet,
            ${userAgent}
          )
        `
      })
    } catch (error) {
      // Auditoria nunca derruba a requisição principal.
      app.log.error({ error }, 'falha ao registrar auditoria')
    }
  })
}

export default fp(auditPlugin, { name: 'audit' })
