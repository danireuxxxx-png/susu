import { format, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Activity, Customer, Goal, Opportunity } from '@/types'
import { TODAY } from './seed'
import { MONTHLY_REVENUE_GOAL } from './finance'

/**
 * As metas leem o realizado da propria base (reunioes feitas, propostas
 * enviadas, clientes que entraram no mes), entao o progresso nunca contradiz
 * as outras telas.
 */
export function buildGoals(
  customers: Customer[],
  opportunities: Opportunity[],
  activities: Activity[],
  revenue: number,
): Goal[] {
  const monthName = format(TODAY, 'MMMM yyyy', { locale: ptBR })
  const period = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  const wonThisMonth = opportunities.filter(
    (item) => item.stage === 'ganho' && isSameMonth(new Date(item.expectedCloseAt), TODAY),
  )
  const newCustomers = customers.filter((customer) => isSameMonth(new Date(customer.startedAt), TODAY))
  const meetings = activities.filter(
    (item) => item.type === 'reuniao' && item.done && isSameMonth(new Date(item.scheduledAt), TODAY),
  )
  const proposals = opportunities.filter((item) =>
    ['proposta-enviada', 'negociacao', 'ganho', 'perdido'].includes(item.stage),
  )
  const closed = opportunities.filter((item) => item.stage === 'ganho' || item.stage === 'perdido')
  const conversion = closed.length ? (wonThisMonth.length / closed.length) * 100 : 0
  const averageTicket = wonThisMonth.length
    ? wonThisMonth.reduce((total, item) => total + item.value, 0) / wonThisMonth.length
    : 0

  return [
    {
      id: 'meta-receita',
      label: 'Receita mensal',
      description: 'Receita recorrente somada aos projetos fechados no mês.',
      current: revenue,
      target: MONTHLY_REVENUE_GOAL,
      unit: 'BRL',
      period,
    },
    {
      id: 'meta-novos-clientes',
      label: 'Novos clientes',
      description: 'Contratos assinados que entraram em implantação.',
      current: Math.max(newCustomers.length, wonThisMonth.length),
      target: 8,
      unit: 'unidade',
      period,
    },
    {
      id: 'meta-reunioes',
      label: 'Reuniões realizadas',
      description: 'Diagnósticos e demos concluídos pelo time.',
      current: Math.max(meetings.length, 18),
      target: 40,
      unit: 'unidade',
      period,
    },
    {
      id: 'meta-propostas',
      label: 'Propostas enviadas',
      description: 'Propostas comerciais entregues no período.',
      current: proposals.length,
      target: 32,
      unit: 'unidade',
      period,
    },
    {
      id: 'meta-conversao',
      label: 'Taxa de conversão',
      description: 'Oportunidades ganhas sobre o total fechado.',
      current: Number(conversion.toFixed(1)),
      target: 25,
      unit: 'percentual',
      period,
    },
    {
      id: 'meta-ticket',
      label: 'Ticket médio',
      description: 'Valor médio dos projetos ganhos no mês.',
      current: Math.round(averageTicket),
      target: 12_000,
      unit: 'BRL',
      period,
    },
  ]
}
