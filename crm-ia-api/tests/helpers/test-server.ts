/**
 * Ambiente de teste ponta a ponta.
 *
 * Sobe um Postgres real (PGlite via socket) com migrations e seed, aponta
 * a API para ele e assina JWTs válidos localmente. Os testes exercitam o
 * caminho completo: HTTP → Fastify → postgres.js → RLS.
 */
import { createHmac } from 'node:crypto'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import type { FastifyInstance } from 'fastify'
import { createDatabase } from '../../scripts/pg-harness.js'

export const JWT_SECRET = 'test-secret-para-assinatura-local-0123456789'

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function signToken(userId: string, expiresInSeconds = 3600) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64Url(
    JSON.stringify({
      sub: userId,
      role: 'authenticated',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    }),
  )
  const signature = base64Url(createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest())
  return `${header}.${payload}.${signature}`
}

export interface TestContext {
  app: FastifyInstance
  ids: Record<string, string>
  stop: () => Promise<void>
}

export async function startTestServer(port = 5440): Promise<TestContext> {
  const db = await createDatabase({ withSeed: true })
  const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' })
  await server.start()

  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${port}/postgres`
  process.env.DATABASE_SSL = 'disable'
  process.env.SUPABASE_JWT_SECRET = JWT_SECRET
  process.env.NODE_ENV = 'test'
  process.env.LOG_LEVEL = 'fatal'
  process.env.RATE_LIMIT_MAX = '10000'

  const { rows } = await db.query<{ key: string; id: string }>(`
    select 'org' as key, id::text from public.organizations where name = 'IA.centrism'
    union all select 'orgOutra', id::text from public.organizations where name = 'Outra Empresa'
    union all select 'owner', id::text from public.profiles where email = 'owner@iacentrism.ai'
    union all select 'admin', id::text from public.profiles where email = 'admin@iacentrism.ai'
    union all select 'manager', id::text from public.profiles where email = 'manager@iacentrism.ai'
    union all select 'sales', id::text from public.profiles where email = 'sales@iacentrism.ai'
    union all select 'finance', id::text from public.profiles where email = 'finance@iacentrism.ai'
    union all select 'outsider', id::text from public.profiles where email = 'outsider@outra.ai'
    union all select 'companyAlpha', id::text from public.companies where trade_name = 'Alpha Imóveis'
    union all select 'companyBeta', id::text from public.companies where trade_name = 'Beta Contabilidade'
    union all select 'projectAlphaAgente', id::text from public.projects where name = 'Agente Comercial IA'
    union all select 'pipeline', id::text from public.pipelines where is_default
    union all select 'stageNovo', id::text from public.pipeline_stages where name = 'Novo Lead'
    union all select 'stageProposta', id::text from public.pipeline_stages where name = 'Proposta Enviada'
    union all select 'stageGanho', id::text from public.pipeline_stages where name = 'Fechado / Ganho'
  `)

  const ids = Object.fromEntries(rows.map((row) => [row.key, row.id]))

  // A app só é importada depois do env estar pronto: env.ts valida na carga.
  const { buildApp } = await import('../../src/app.js')
  const app = await buildApp()
  await app.ready()

  return {
    app,
    ids,
    stop: async () => {
      await app.close()
      const { closeDatabase } = await import('../../src/lib/db.js')
      await closeDatabase()
      await server.stop()
      await db.close()
    },
  }
}

export function authHeaders(userId: string, organizationId?: string) {
  const headers: Record<string, string> = { authorization: `Bearer ${signToken(userId)}` }
  if (organizationId) headers['x-organization-id'] = organizationId
  return headers
}
