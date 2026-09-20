import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { authHeaders, signToken, startTestServer, type TestContext } from './helpers/test-server.js'

let ctx: TestContext

beforeAll(async () => {
  ctx = await startTestServer(5441)
}, 180_000)

afterAll(async () => {
  await ctx?.stop()
})

describe('autenticação', () => {
  it('recusa requisição sem token', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/api/v1/companies' })
    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('UNAUTHORIZED')
  })

  it('recusa token com assinatura inválida', async () => {
    const tampered = `${signToken(ctx.ids.owner!).split('.').slice(0, 2).join('.')}.assinaturafalsa`
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/companies',
      headers: { authorization: `Bearer ${tampered}` },
    })
    expect(response.statusCode).toBe(401)
  })

  it('recusa token expirado', async () => {
    const expired = signToken(ctx.ids.owner!, -60)
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/companies',
      headers: { authorization: `Bearer ${expired}` },
    })
    expect(response.statusCode).toBe(401)
    expect(response.json().error.message).toMatch(/expirada/i)
  })

  it('devolve o perfil e os vínculos do usuário', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: authHeaders(ctx.ids.owner!),
    })

    expect(response.statusCode).toBe(200)
    const body = response.json().data
    expect(body.user.email).toBe('owner@iacentrism.ai')
    expect(body.role).toBe('OWNER')
    expect(body.memberships).toHaveLength(1)
  })

  it('não deixa entrar em organização da qual o usuário não participa', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: authHeaders(ctx.ids.owner!, ctx.ids.orgOutra!),
    })

    expect(response.statusCode).toBe(403)
  })
})

describe('autorização por papel', () => {
  it('SALES não cria custo de projeto (área financeira)', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/project-costs',
      headers: authHeaders(ctx.ids.sales!),
      payload: {
        projectId: ctx.ids.projectAlphaAgente,
        name: 'Tentativa indevida',
        amount: 100,
      },
    })

    expect(response.statusCode).toBe(403)
  })

  it('FINANCE cria custo de projeto', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/project-costs',
      headers: authHeaders(ctx.ids.finance!),
      payload: {
        projectId: ctx.ids.projectAlphaAgente,
        name: 'Monitoramento',
        category: 'SOFTWARE',
        provider: 'Grafana',
        amount: 90,
        billingPeriod: 'MONTHLY',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().data.name).toBe('Monitoramento')
  })

  it('FINANCE não cria empresa (área comercial)', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/companies',
      headers: authHeaders(ctx.ids.finance!),
      payload: { tradeName: 'Empresa Indevida' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('registra o evento de auditoria de permissão', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/audit-logs?limit=5',
      headers: authHeaders(ctx.ids.owner!),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().meta.total).toBeGreaterThan(0)
  })

  it('SALES não lê a trilha de auditoria', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/audit-logs',
      headers: authHeaders(ctx.ids.sales!),
    })

    expect(response.statusCode).toBe(403)
  })
})
