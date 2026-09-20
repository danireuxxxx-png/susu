import { isAfter, isWithinInterval, subDays } from 'date-fns'
import { OPEN_STAGES, PIPELINE_STAGES } from '@/constants/pipeline'
import { LEAD_SOURCES } from '@/constants/labels'
import type {
  Activity,
  Customer,
  Goal,
  Lead,
  MonthlyFinance,
  Opportunity,
  PipelineStageId,
} from '@/types'
import { ratio, sum } from './utils'

export interface KpiValue {
  value: number
  delta: number | null
}

export function isOpen(opportunity: Opportunity) {
  return opportunity.stage !== 'ganho' && opportunity.stage !== 'perdido'
}

export function openOpportunities(opportunities: Opportunity[]) {
  return opportunities.filter(isOpen)
}

export function pipelineValue(opportunities: Opportunity[]) {
  return sum(openOpportunities(opportunities), (item) => item.value)
}

/** Valor ponderado pela probabilidade da etapa — a previsao "realista". */
export function weightedPipelineValue(opportunities: Opportunity[]) {
  return sum(openOpportunities(opportunities), (item) => (item.value * item.probability) / 100)
}

export interface StageSummary {
  id: PipelineStageId
  label: string
  shortLabel: string
  count: number
  value: number
}

export function summarizeStages(opportunities: Opportunity[]): StageSummary[] {
  return PIPELINE_STAGES.map((stage) => {
    const items = opportunities.filter((item) => item.stage === stage.id)
    return {
      id: stage.id,
      label: stage.label,
      shortLabel: stage.shortLabel,
      count: items.length,
      value: sum(items, (item) => item.value),
    }
  })
}

export function funnelSummary(opportunities: Opportunity[]) {
  const summaries = summarizeStages(opportunities)
  const byId = new Map(summaries.map((item) => [item.id, item]))
  return [...OPEN_STAGES.map((stage) => byId.get(stage.id)!), byId.get('ganho')!]
}

export function conversionRate(opportunities: Opportunity[]) {
  const closed = opportunities.filter((item) => !isOpen(item))
  const won = opportunities.filter((item) => item.stage === 'ganho')
  return ratio(won.length, closed.length) * 100
}

export function averageTicket(opportunities: Opportunity[]) {
  const won = opportunities.filter((item) => item.stage === 'ganho')
  if (!won.length) return 0
  return sum(won, (item) => item.value) / won.length
}

export function leadsBySource(leads: Lead[]) {
  return LEAD_SOURCES.map((source) => ({
    id: source.id,
    label: source.label,
    count: leads.filter((lead) => lead.source === source.id).length,
  })).sort((a, b) => b.count - a.count)
}

export function newLeadsWindow(leads: Lead[], days = 30) {
  const start = subDays(new Date(), days)
  const previousStart = subDays(start, days)
  const current = leads.filter((lead) => isAfter(new Date(lead.createdAt), start)).length
  const previous = leads.filter((lead) =>
    isWithinInterval(new Date(lead.createdAt), { start: previousStart, end: start }),
  ).length
  return { current, previous, delta: previous ? ((current - previous) / previous) * 100 : null }
}

export function activeCustomers(customers: Customer[]) {
  return customers.filter((customer) => customer.status !== 'churn')
}

export function mrr(customers: Customer[]) {
  return sum(activeCustomers(customers), (customer) => customer.mrr)
}

export function arr(customers: Customer[]) {
  return mrr(customers) * 12
}

export function financeTotals(month: MonthlyFinance | undefined) {
  if (!month) return { revenue: 0, cost: 0, profit: 0, margin: 0 }
  const profit = month.revenue - month.cost
  return {
    revenue: month.revenue,
    cost: month.cost,
    profit,
    margin: ratio(profit, month.revenue) * 100,
  }
}

export function deltaBetween(current: number, previous: number) {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

export function stalledOpportunities(opportunities: Opportunity[], days = 5) {
  const threshold = subDays(new Date(), days)
  return openOpportunities(opportunities)
    .filter((item) => new Date(item.lastInteractionAt) < threshold)
    .sort((a, b) => a.lastInteractionAt.localeCompare(b.lastInteractionAt))
}

export function todayActivities(activities: Activity[]) {
  const now = new Date()
  return activities
    .filter((item) => {
      const date = new Date(item.scheduledAt)
      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      )
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

export function goalProgress(goal: Goal) {
  return ratio(goal.current, goal.target) * 100
}
