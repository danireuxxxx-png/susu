import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import Fastify, { type FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { corsOrigins, env, isProduction } from './env.js'
import { AppError, translateDatabaseError } from './lib/errors.js'
import auditPlugin from './plugins/audit.js'
import authPlugin from './plugins/auth.js'
import { authRoutes } from './modules/auth.routes.js'
import { crmRoutes } from './modules/crm.routes.js'
import { dashboardRoutes } from './modules/dashboard.routes.js'
import { deliveryRoutes } from './modules/delivery.routes.js'
import { engagementRoutes } from './modules/engagement.routes.js'
import { financialRoutes } from './modules/financial.routes.js'
import { organizationRoutes } from './modules/organizations.routes.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      // Nunca logar credenciais nem tokens.
      redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.refreshToken'],
      transport: isProduction ? undefined : { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } },
    },
    trustProxy: true,
    bodyLimit: 1_048_576,
  })

  await app.register(helmet, { contentSecurityPolicy: false })

  await app.register(cors, {
    origin: (origin, callback) => {
      // Requisições sem Origin (curl, health check) são permitidas;
      // navegador só passa com origem na lista.
      if (!origin || corsOrigins.includes(origin)) return callback(null, true)
      callback(new AppError('Origem não permitida', 403, 'CORS_REJECTED'), false)
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
  })

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    keyGenerator: (request) => {
      const header = request.headers.authorization
      // Limita por usuário quando autenticado; por IP no login.
      return header ? `${request.ip}:${header.slice(-24)}` : request.ip
    },
  })

  await app.register(authPlugin)
  await app.register(auditPlugin)

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(422).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      })
    }

    if (error instanceof AppError) {
      if (error.statusCode >= 500) request.log.error({ error }, error.message)
      return reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      })
    }

    const translated = translateDatabaseError(error)
    if (translated) {
      request.log.warn({ code: (error as { code?: string }).code }, translated.message)
      return reply.code(translated.statusCode).send({
        error: { code: translated.code, message: translated.message },
      })
    }

    if ((error as { statusCode?: number }).statusCode === 429) {
      return reply.code(429).send({
        error: { code: 'RATE_LIMITED', message: 'Muitas requisições. Tente novamente em instantes.' },
      })
    }

    // Erro não previsto: log completo no servidor, mensagem genérica no cliente.
    request.log.error({ error }, 'erro não tratado')
    return reply.code(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
    })
  })

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: { code: 'NOT_FOUND', message: `Rota ${request.method} ${request.url} não existe` },
    })
  })

  app.get('/health', async () => ({
    status: 'ok',
    service: 'crm-ia-api',
    timestamp: new Date().toISOString(),
  }))

  await app.register(
    async (api) => {
      await api.register(authRoutes)
      await api.register(organizationRoutes)
      await api.register(crmRoutes)
      await api.register(deliveryRoutes)
      await api.register(financialRoutes)
      await api.register(engagementRoutes)
      await api.register(dashboardRoutes)
    },
    { prefix: '/api/v1' },
  )

  return app
}
