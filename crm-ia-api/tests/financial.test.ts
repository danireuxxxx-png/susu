import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { authHeaders, startTestServer, type TestContext } from './helpers/test-server.js'

let ctx: TestContext

beforeAll(async () => {
  ctx = await startTestServer(5444)
}, 180_000)

afterAll(async () => {
  await ctx?.stop()
})

/**
 * Os números abaixo são conferíveis à mão a partir do seed:
 *   Alpha Imóveis → 8.000 + 4.000 + 3.000 = 15.000 de receita
 *                   560 + 740 + 200       =  1.500 de custo
 *                   lucro 13.500, margem 90%
 */
describe('rentabilidade por cliente', () => {
  it('responde quanto o cliente paga, quanto custa e quanto sobra', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/companies/${ctx.ids.companyAlpha}/economics`,
      headers: authHeaders(ctx.ids.owner!),
    })

    expect(response.statusCode).toBe(200)
    const data = response.json().data

    expect(data.company.name).toBe('Alpha Imóveis')
    expect(Number(data.monthly.revenue)).toBe(15000)
    expect(Number(data.monthly.cost)).toBe(1500)
    expect(Number(data.monthly.profit)).toBe(13500)
    expect(Number(data.monthly.margin)).toBe(90)

    expect(Number(data.annualized.revenue)).toBe(180000)
    expect(Number(data.annualized.cost)).toBe(18000)
    expect(Number(data.annualized.profit)).toBe(162000)

    expect(data.projects).toHaveLength(3)
  })

  it('ordena os projetos do cliente pelo custo, do mais caro para o mais barato', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/companies/${ctx.ids.companyAlpha}/economics`,
      headers: authHeaders(ctx.ids.owner!),
    })

    const projects = response.json().data.projects as { name: string; cost: number }[]
    expect(projects[0]!.name).toBe('Automação de CRM')
    expect(Number(projects[0]!.cost)).toBe(740)
    expect(Number(projects[2]!.cost)).toBe(200)
  })
})

describe('rentabilidade por projeto', () => {
  it('detalha receita, custo, lucro, margem e as linhas de custo', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/projects/${ctx.ids.projectAlphaAgente}/economics`,
      headers: authHeaders(ctx.ids.owner!),
    })

    const data = response.json().data
    expect(Number(data.monthlyRevenue)).toBe(8000)
    expect(Number(data.monthlyCost)).toBe(560)
    expect(Number(data.monthlyProfit)).toBe(7440)
    expect(Number(data.margin)).toBe(93)

    // OpenAI 280 + VPS 120 + Supabase 50 + WhatsApp 90 + Storage 20
    expect(data.costBreakdown).toHaveLength(5)
    expect(Number(data.costBreakdown[0].monthlyAmount)).toBe(280)
    expect(data.costBreakdown[0].provider).toBe('OpenAI')
  })

  it('soma as linhas de custo exatamente igual ao total', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/projects/${ctx.ids.projectAlphaAgente}/costs`,
      headers: authHeaders(ctx.ids.finance!),
    })

    const data = response.json().data
    const sum = (data.costs as { monthly_amount: string }[]).reduce(
      (total, cost) => total + Number(cost.monthly_amount),
      0,
    )
    expect(sum).toBe(Number(data.monthlyCost))
  })

  it('normaliza períodos diferentes para a base mensal', async () => {
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/project-costs',
      headers: authHeaders(ctx.ids.finance!),
      payload: {
        projectId: ctx.ids.projectAlphaAgente,
        name: 'Licença anual',
        category: 'SOFTWARE',
        amount: 1200,
        billingPeriod: 'YEARLY',
      },
    })
    expect(created.statusCode).toBe(201)

    const economics = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/projects/${ctx.ids.projectAlphaAgente}/economics`,
      headers: authHeaders(ctx.ids.owner!),
    })

    // 1200/ano = 100/mês → 560 + 100
    expect(Number(economics.json().data.monthlyCost)).toBe(660)
  })

  it('ignora custo pontual no cálculo da recorrência', async () => {
    await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/project-costs',
      headers: authHeaders(ctx.ids.finance!),
      payload: {
        projectId: ctx.ids.projectAlphaAgente,
        name: 'Setup de infraestrutura',
        amount: 5000,
        billingPeriod: 'ONE_TIME',
      },
    })

    const economics = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/projects/${ctx.ids.projectAlphaAgente}/economics`,
      headers: authHeaders(ctx.ids.owner!),
    })

    expect(Number(economics.json().data.monthlyCost)).toBe(660)
  })

  it('guarda o histórico quando o custo muda de valor', async () => {
    const costs = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/project-costs?projectId=${ctx.ids.projectAlphaAgente}&search=OpenAI`,
      headers: authHeaders(ctx.ids.finance!),
    })
    const cost = costs.json().data[0]

    const updated = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/project-costs/${cost.id}`,
      headers: authHeaders(ctx.ids.finance!),
      payload: { amount: 420, estimatedMonthlyCost: 420 },
    })
    expect(updated.statusCode).toBe(200)

    const economics = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/projects/${ctx.ids.projectAlphaAgente}/economics`,
      headers: authHeaders(ctx.ids.owner!),
    })
    // 660 - 280 + 420
    expect(Number(economics.json().data.monthlyCost)).toBe(800)
  })
})

describe('visão da operação', () => {
  it('calcula MRR, ARR, custos e lucro', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/summary',
      headers: authHeaders(ctx.ids.finance!),
    })

    const data = response.json().data
    expect(data.recurring.mrr).toBe(72900)
    expect(data.recurring.arr).toBe(data.recurring.mrr * 12)
    expect(data.costs.operating).toBe(37900)
    expect(data.costs.total).toBe(data.costs.projects + data.costs.operating)
    expect(data.profit.gross).toBe(data.recurring.mrr - data.costs.projects)
    expect(data.profit.net).toBe(data.recurring.mrr - data.costs.total)
    expect(data.profit.grossMargin).toBeCloseTo((data.profit.gross / data.recurring.mrr) * 100, 1)
  })

  it('separa receita recorrente de pontual no faturamento', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/revenue?months=6',
      headers: authHeaders(ctx.ids.finance!),
    })

    const months = response.json().data as { recurring: string; one_time: string }[]
    expect(months.length).toBeGreaterThan(0)
    expect(Number(months[months.length - 1]!.recurring)).toBeGreaterThan(0)
  })

  it('quebra os custos por categoria e por fornecedor', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/expenses',
      headers: authHeaders(ctx.ids.finance!),
    })

    const data = response.json().data
    const aiApi = data.byCategory.find((row: { category: string }) => row.category === 'AI_API')
    const openai = data.byProvider.find((row: { provider: string }) => row.provider === 'OpenAI')

    expect(Number(aiApi.monthly_amount)).toBeGreaterThan(0)
    expect(Number(openai.monthly_amount)).toBeGreaterThan(0)
  })

  it('ordena a rentabilidade por cliente conforme pedido', async () => {
    const byProfit = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/customer-profitability?orderBy=profit&direction=desc',
      headers: authHeaders(ctx.ids.finance!),
    })
    const byCost = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/customer-profitability?orderBy=cost&direction=desc',
      headers: authHeaders(ctx.ids.finance!),
    })

    const profitRows = byProfit.json().data
    const costRows = byCost.json().data

    expect(profitRows[0].company_name).toBe('Alpha Imóveis')
    expect(Number(costRows[0].monthly_cost)).toBeGreaterThanOrEqual(Number(costRows[1].monthly_cost))
  })

  it('calcula o progresso das metas a partir dos dados reais', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/goals/progress',
      headers: authHeaders(ctx.ids.owner!),
    })

    const goals = response.json().data as { type: string; current_value: string; progress: string }[]
    const mrr = goals.find((goal) => goal.type === 'MRR')

    expect(Number(mrr?.current_value)).toBe(72900)
    expect(Number(mrr?.progress)).toBeCloseTo(85.76, 1)
  })

  it('gera as mensalidades da competência sem duplicar', async () => {
    const first = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/financial/generate-monthly-revenues',
      headers: authHeaders(ctx.ids.finance!),
      payload: {},
    })
    const second = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/financial/generate-monthly-revenues',
      headers: authHeaders(ctx.ids.finance!),
      payload: {},
    })

    expect(second.json().data.created).toBe(0)
    expect(first.statusCode).toBe(200)
  })
})

describe('dashboard', () => {
  it('entrega os indicadores prontos para a tela', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/summary',
      headers: authHeaders(ctx.ids.owner!),
    })

    const data = response.json().data
    expect(data.revenue.mrr).toBe(72900)
    expect(data.pipeline.value).toBeGreaterThan(0)
    expect(data.conversion.rate).toBeGreaterThanOrEqual(0)
    expect(data.customers.active).toBeGreaterThan(0)
  })
})
