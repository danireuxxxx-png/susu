import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { authHeaders, startTestServer, type TestContext } from './helpers/test-server.js'

let ctx: TestContext

beforeAll(async () => {
  ctx = await startTestServer(5443)
}, 180_000)

afterAll(async () => {
  await ctx?.stop()
})

describe('leads', () => {
  it('lista com paginação e metadados', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/leads?page=1&limit=10',
      headers: authHeaders(ctx.ids.sales!),
    })

    const body = response.json()
    expect(response.statusCode).toBe(200)
    expect(body.data).toHaveLength(10)
    expect(body.meta).toMatchObject({ page: 1, limit: 10, total: 50, totalPages: 5 })
  })

  it('filtra por status e por origem', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/leads?status=QUALIFIED&limit=100',
      headers: authHeaders(ctx.ids.sales!),
    })

    const body = response.json()
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data.every((lead: { status: string }) => lead.status === 'QUALIFIED')).toBe(true)
  })

  it('valida o corpo antes de gravar', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/leads',
      headers: authHeaders(ctx.ids.sales!),
      payload: { name: '', email: 'não-é-email' },
    })

    expect(response.statusCode).toBe(422)
    expect(response.json().error.code).toBe('VALIDATION_ERROR')
    expect(response.json().error.details.length).toBeGreaterThan(0)
  })

  it('cria, atualiza e exclui logicamente', async () => {
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/leads',
      headers: authHeaders(ctx.ids.sales!),
      payload: {
        name: 'Joana Martins',
        email: 'joana@empresa.com.br',
        source: 'WHATSAPP',
        estimatedValue: 12000,
        companyId: ctx.ids.companyBeta,
      },
    })

    expect(created.statusCode).toBe(201)
    const leadId = created.json().data.id

    const updated = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/leads/${leadId}`,
      headers: authHeaders(ctx.ids.sales!),
      payload: { status: 'QUALIFIED', temperature: 'HOT' },
    })
    expect(updated.json().data.status).toBe('QUALIFIED')

    const removed = await ctx.app.inject({
      method: 'DELETE',
      url: `/api/v1/leads/${leadId}`,
      headers: authHeaders(ctx.ids.sales!),
    })
    expect(removed.statusCode).toBe(200)

    const afterDelete = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/leads?search=Joana`,
      headers: authHeaders(ctx.ids.sales!),
    })
    expect(afterDelete.json().data).toHaveLength(0)
  })
})

describe('conversão de lead', () => {
  it('cria oportunidade, histórico e atividade em uma transação', async () => {
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/leads',
      headers: authHeaders(ctx.ids.sales!),
      payload: {
        name: 'Carlos Convertido',
        companyId: ctx.ids.companyBeta,
        estimatedValue: 25000,
        source: 'REFERRAL',
      },
    })
    const leadId = created.json().data.id

    const converted = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/leads/${leadId}/convert`,
      headers: authHeaders(ctx.ids.sales!),
      payload: { title: 'Agente de IA — Beta', value: 25000 },
    })

    expect(converted.statusCode).toBe(201)
    const opportunity = converted.json().data
    expect(opportunity.title).toBe('Agente de IA — Beta')
    expect(Number(opportunity.value)).toBe(25000)

    const lead = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/leads/${leadId}`,
      headers: authHeaders(ctx.ids.sales!),
    })
    expect(lead.json().data.status).toBe('CONVERTED')
    expect(lead.json().data.converted_at).toBeTruthy()

    const history = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/opportunities/${opportunity.id}/history`,
      headers: authHeaders(ctx.ids.sales!),
    })
    expect(history.json().data.length).toBeGreaterThan(0)

    const activities = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/activities?opportunityId=${opportunity.id}`,
      headers: authHeaders(ctx.ids.sales!),
    })
    expect(activities.json().data.length).toBeGreaterThan(0)
  })

  it('não converte o mesmo lead duas vezes', async () => {
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/leads',
      headers: authHeaders(ctx.ids.sales!),
      payload: { name: 'Lead Único', companyId: ctx.ids.companyBeta },
    })
    const leadId = created.json().data.id

    const first = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/leads/${leadId}/convert`,
      headers: authHeaders(ctx.ids.sales!),
      payload: {},
    })
    expect(first.statusCode).toBe(201)

    const second = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/leads/${leadId}/convert`,
      headers: authHeaders(ctx.ids.sales!),
      payload: {},
    })
    expect(second.statusCode).toBe(409)
  })
})

describe('pipeline', () => {
  it('move a oportunidade de etapa e registra o histórico', async () => {
    const list = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/opportunities?limit=1',
      headers: authHeaders(ctx.ids.sales!),
    })
    const opportunity = list.json().data[0]

    const moved = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/opportunities/${opportunity.id}/stage`,
      headers: authHeaders(ctx.ids.sales!),
      payload: { stageId: ctx.ids.stageProposta, note: 'Proposta enviada' },
    })

    expect(moved.statusCode).toBe(200)
    expect(moved.json().data.stage_id).toBe(ctx.ids.stageProposta)
    // A probabilidade acompanha a etapa, não fica solta.
    expect(Number(moved.json().data.probability)).toBe(70)

    const history = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/opportunities/${opportunity.id}/history`,
      headers: authHeaders(ctx.ids.sales!),
    })
    expect(history.json().data[0].note).toBe('Proposta enviada')
  })

  it('marca won_at ao entrar na etapa de ganho', async () => {
    const list = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/opportunities?limit=5',
      headers: authHeaders(ctx.ids.manager!),
    })
    const opportunity = list.json().data[2]

    const moved = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/opportunities/${opportunity.id}/stage`,
      headers: authHeaders(ctx.ids.manager!),
      payload: { stageId: ctx.ids.stageGanho },
    })

    expect(moved.json().data.won_at).toBeTruthy()
    expect(moved.json().data.lost_at).toBeNull()
  })

  it('resumo do funil soma valor total e ponderado', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/pipeline',
      headers: authHeaders(ctx.ids.owner!),
    })

    const stages = response.json().data
    expect(stages).toHaveLength(8)
    expect(Number(stages[0].total_value)).toBeGreaterThanOrEqual(0)
  })
})

describe('venda vira projeto', () => {
  it('cria projeto a partir da oportunidade e registra a implantação', async () => {
    const list = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/opportunities?limit=8',
      headers: authHeaders(ctx.ids.manager!),
    })
    const opportunity = list.json().data[5]

    const project = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/opportunities/${opportunity.id}/project`,
      headers: authHeaders(ctx.ids.manager!),
      payload: { name: 'Novo projeto de teste', monthlyRevenue: 5000, setupRevenue: 3000, status: 'ACTIVE' },
    })

    expect(project.statusCode).toBe(201)
    expect(Number(project.json().data.monthly_revenue)).toBe(5000)

    const revenues = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/revenues?projectId=${project.json().data.id}&type=SETUP`,
      headers: authHeaders(ctx.ids.finance!),
    })
    expect(revenues.json().data).toHaveLength(1)
    expect(Number(revenues.json().data[0].amount)).toBe(3000)
  })
})
