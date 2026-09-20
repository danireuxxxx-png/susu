import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { authHeaders, startTestServer, type TestContext } from './helpers/test-server.js'

let ctx: TestContext

beforeAll(async () => {
  ctx = await startTestServer(5442)
}, 180_000)

afterAll(async () => {
  await ctx?.stop()
})

/**
 * O isolamento é o requisito mais sensível do produto: um cliente não
 * pode, em hipótese alguma, enxergar dados de outro. Os testes abaixo
 * atacam pela API e pelo banco.
 */
describe('isolamento multi-tenant', () => {
  it('usuário de outra organização não vê empresas desta', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/companies',
      headers: authHeaders(ctx.ids.outsider!),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data).toHaveLength(0)
    expect(response.json().meta.total).toBe(0)
  })

  it('buscar por ID um registro de outra organização devolve 404', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/companies/${ctx.ids.companyAlpha}`,
      headers: authHeaders(ctx.ids.outsider!),
    })

    // 404 e não 403: a resposta não confirma que o registro existe.
    expect(response.statusCode).toBe(404)
  })

  it('não permite alterar registro de outra organização', async () => {
    const response = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/companies/${ctx.ids.companyAlpha}`,
      headers: authHeaders(ctx.ids.outsider!),
      payload: { tradeName: 'Invadida' },
    })

    expect([403, 404]).toContain(response.statusCode)

    const check = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/companies/${ctx.ids.companyAlpha}`,
      headers: authHeaders(ctx.ids.owner!),
    })
    expect(check.json().data.trade_name).toBe('Alpha Imóveis')
  })

  it('não permite excluir registro de outra organização', async () => {
    const response = await ctx.app.inject({
      method: 'DELETE',
      url: `/api/v1/companies/${ctx.ids.companyAlpha}`,
      headers: authHeaders(ctx.ids.outsider!),
    })

    expect([403, 404]).toContain(response.statusCode)
  })

  it('não permite gravar em outra organização forjando o corpo', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/companies',
      headers: authHeaders(ctx.ids.outsider!),
      payload: {
        tradeName: 'Plantada na organização errada',
        // Campo ignorado: organization_id vem sempre da sessão.
        organizationId: ctx.ids.org,
      },
    })

    expect(response.statusCode).toBe(201)

    const check = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/companies?search=Plantada',
      headers: authHeaders(ctx.ids.owner!),
    })
    expect(check.json().data).toHaveLength(0)
  })

  it('relatórios financeiros só agregam a própria organização', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/summary',
      headers: authHeaders(ctx.ids.outsider!),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.recurring.mrr).toBe(0)
  })

  it('rentabilidade por cliente não vaza entre organizações', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/customer-profitability',
      headers: authHeaders(ctx.ids.outsider!),
    })

    expect(response.json().data).toHaveLength(0)
  })

  it('economia de um cliente de outra organização devolve 404', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/companies/${ctx.ids.companyAlpha}/economics`,
      headers: authHeaders(ctx.ids.outsider!),
    })

    expect(response.statusCode).toBe(404)
  })
})
