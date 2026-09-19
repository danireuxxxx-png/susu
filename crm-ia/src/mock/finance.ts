import { format, isSameMonth, startOfMonth, subDays, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Customer, CustomerFinance, MonthlyFinance, Opportunity } from '@/types'
import { TODAY, type Rng } from './seed'

export interface DailyRevenuePoint {
  date: string
  label: string
  revenue: number
}

export interface FinanceDataset {
  monthly: MonthlyFinance[]
  daily: DailyRevenuePoint[]
  byCustomer: CustomerFinance[]
}

const MONTHS_OF_HISTORY = 12
const DAYS_OF_HISTORY = 120
/** Meta do mes corrente — as metas anteriores sao derivadas dela. */
export const MONTHLY_REVENUE_GOAL = 250_000

/**
 * A receita do mes corrente NAO e sorteada: ela e a soma do MRR da carteira
 * ativa com os projetos ganhos no mes. Assim o financeiro, o dashboard e a
 * pagina de clientes contam sempre a mesma historia.
 */
export function currentMonthRevenue(customers: Customer[], opportunities: Opportunity[]) {
  const recurring = customers
    .filter((customer) => customer.status !== 'churn')
    .reduce((total, customer) => total + customer.mrr, 0)

  const oneTime = opportunities
    .filter((item) => item.stage === 'ganho' && isSameMonth(new Date(item.expectedCloseAt), TODAY))
    .reduce((total, item) => total + item.value, 0)

  return { recurring, oneTime, total: recurring + oneTime }
}

export function buildFinance(
  rng: Rng,
  customers: Customer[],
  opportunities: Opportunity[],
): FinanceDataset {
  const { total: currentRevenue } = currentMonthRevenue(customers, opportunities)

  const monthly: MonthlyFinance[] = Array.from({ length: MONTHS_OF_HISTORY }, (_, index) => {
    const monthsAgo = MONTHS_OF_HISTORY - 1 - index
    const date = startOfMonth(subMonths(TODAY, monthsAgo))
    // Crescimento composto de ~6,5% a.m. olhando para tras, com ruido leve.
    const decay = 1.065 ** monthsAgo
    const noise = monthsAgo === 0 ? 1 : rng.float(0.94, 1.06)
    const revenue = monthsAgo === 0 ? currentRevenue : Math.round((currentRevenue / decay) * noise)
    const cost = Math.round(revenue * rng.float(0.3, 0.36))
    const goal = Math.round(MONTHLY_REVENUE_GOAL / 1.05 ** monthsAgo / 1000) * 1000

    return {
      month: format(date, 'yyyy-MM'),
      label: format(date, 'MMM', { locale: ptBR }).replace('.', ''),
      revenue,
      cost,
      goal,
    }
  })

  // Serie diaria para os recortes de 7/30/90 dias do dashboard.
  const weights = Array.from({ length: DAYS_OF_HISTORY }, (_, index) => {
    const date = subDays(TODAY, DAYS_OF_HISTORY - 1 - index)
    const weekday = date.getDay()
    const weekend = weekday === 0 || weekday === 6
    const trend = 0.7 + (index / DAYS_OF_HISTORY) * 0.6
    return { date, weight: (weekend ? rng.float(0.1, 0.3) : rng.float(0.8, 1.35)) * trend }
  })

  const last30Weight = weights.slice(-30).reduce((total, item) => total + item.weight, 0)
  const dailyFactor = currentRevenue / last30Weight

  const daily: DailyRevenuePoint[] = weights.map(({ date, weight }) => ({
    date: date.toISOString(),
    label: format(date, 'dd MMM', { locale: ptBR }).replace('.', ''),
    revenue: Math.round((weight * dailyFactor) / 100) * 100,
  }))

  const byCustomer: CustomerFinance[] = customers
    .filter((customer) => customer.status !== 'churn')
    .map((customer) => ({
      customerId: customer.id,
      companyName: customer.companyName,
      revenue: customer.mrr,
      cost: Math.round((customer.mrr * rng.float(0.22, 0.4)) / 50) * 50,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return { monthly, daily, byCustomer }
}
