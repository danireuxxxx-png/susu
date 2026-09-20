import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { authHeaders, startTestServer, type TestContext } from './helpers/test-server.js'

let ctx: TestContext

beforeAll(async () => {
  ctx = await startTestServer(5445)
}, 180_000)

afterAll(async () => {
  await ctx?.stop()
})

/**
 * Números exatos do seed, sem nenhuma mutação antes — é o teste que
 * prova que o motor de cálculo bate com a conta feita à mão:
 *
 *   MRR                   72.900   (soma dos projetos ativos)
 *   custo de projetos      8.180   (soma das linhas de custo vigentes)
 *   custo da operação     37.900   (despesas recorrentes)
 *   lucro bruto           64.720   (MRR - custo de projetos)
 *   lucro líquido         26.820   (bruto - operação)
 */
describe('linha de base da operação', () => {
  it('reproduz os totais do seed', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/summary',
      headers: authHeaders(ctx.ids.owner!),
    })

    const data = response.json().data
    expect(data.recurring.mrr).toBe(72900)
    expect(data.recurring.arr).toBe(874800)
    expect(data.costs.projects).toBe(8180)
    expect(data.costs.operating).toBe(37900)
    expect(data.costs.total).toBe(46080)
    expect(data.profit.gross).toBe(64720)
    expect(data.profit.net).toBe(26820)
    expect(data.profit.grossMargin).toBeCloseTo(88.78, 1)
    expect(data.profit.netMargin).toBeCloseTo(36.79, 1)
  })

  it('projeto em onboarding custa antes de faturar', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/margins',
      headers: authHeaders(ctx.ids.owner!),
    })

    const rows = response.json().data as {
      project_name: string
      status: string
      monthly_revenue: string
      monthly_cost: string
      monthly_profit: string
    }[]

    const onboarding = rows.find((row) => row.project_name === 'Agente de agendamento')
    expect(onboarding?.status).toBe('ONBOARDING')
    expect(Number(onboarding?.monthly_revenue)).toBe(0)
    expect(Number(onboarding?.monthly_cost)).toBe(380)
    expect(Number(onboarding?.monthly_profit)).toBe(-380)
  })

  it('projeto pausado não entra no MRR', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/margins',
      headers: authHeaders(ctx.ids.owner!),
    })

    const rows = response.json().data as { project_name: string; monthly_revenue: string }[]
    const paused = rows.find((row) => row.project_name === 'Automação de propostas')
    expect(Number(paused?.monthly_revenue)).toBe(0)
  })

  it('custo por categoria responde "quanto gasto com APIs de IA"', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/expenses',
      headers: authHeaders(ctx.ids.finance!),
    })

    const byCategory = response.json().data.byCategory as {
      category: string
      scope: string
      monthly_amount: string
    }[]

    const aiApi = byCategory.find((row) => row.category === 'AI_API' && row.scope === 'PROJECT')
    const vps = byCategory.find((row) => row.category === 'VPS' && row.scope === 'PROJECT')

    // 280+150+260+520+340+310+190+780+200+430+290 = 3.750
    expect(Number(aiApi?.monthly_amount)).toBe(3750)
    // 120+500+100+140+160+120+120+100+250+150+150 = 1.910
    expect(Number(vps?.monthly_amount)).toBe(1910)
  })

  it('custo por fornecedor responde "quanto pago para cada provedor"', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/expenses',
      headers: authHeaders(ctx.ids.finance!),
    })

    const byProvider = response.json().data.byProvider as { provider: string; monthly_amount: string }[]
    const hetzner = byProvider.find((row) => row.provider === 'Hetzner')
    const meta = byProvider.find((row) => row.provider === 'Meta')

    expect(Number(hetzner?.monthly_amount)).toBeGreaterThan(0)
    // Meta aparece nas duas pontas: WhatsApp API dos projetos
    // (90+60+90+140+100 = 480) + mídia paga da operação (2.500).
    expect(Number(meta?.monthly_amount)).toBe(2980)
  })

  it('MRR por cliente soma exatamente o MRR total', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/mrr',
      headers: authHeaders(ctx.ids.finance!),
    })

    const data = response.json().data
    const sum = (data.byCustomer as { mrr: string }[]).reduce((total, row) => total + Number(row.mrr), 0)

    expect(sum).toBe(data.mrr)
    expect(data.arr).toBe(data.mrr * 12)
  })
})

describe('série histórica', () => {
  it('devolve 12 meses com receita, custo e lucro coerentes', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/history?months=12',
      headers: authHeaders(ctx.ids.owner!),
    })

    const rows = response.json().data as {
      month: string
      mrr: string
      total_monthly_cost: string
      net_profit: string
    }[]

    expect(rows).toHaveLength(12)

    const current = rows[rows.length - 1]!
    expect(Number(current.mrr)).toBe(72900)
    expect(Number(current.net_profit)).toBe(
      Number(current.mrr) - Number(current.total_monthly_cost),
    )

    // Meses anteriores ao início dos projetos custam menos: a série
    // recalcula a vigência de cada custo, não repete o total de hoje.
    expect(Number(rows[0]!.total_monthly_cost)).toBeLessThan(Number(current.total_monthly_cost))
  })

  it('entrega a receita diária para os recortes curtos', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/financial/revenue-daily?days=120',
      headers: authHeaders(ctx.ids.owner!),
    })

    const rows = response.json().data as { day: string; billed: string }[]
    expect(rows.length).toBeGreaterThan(0)
    expect(Number(rows[0]!.billed)).toBeGreaterThan(0)
  })
})
