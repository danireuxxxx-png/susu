import { isSameDay, isToday, subDays } from 'date-fns'
import type { Activity, BriefingPriority, Lead, MorningBriefing, Opportunity } from '@/types'
import { formatCurrency, formatTime } from '@/lib/format'
import { ratio, sum } from '@/lib/utils'
import { TODAY } from './seed'

/**
 * O briefing e derivado da base — ele descreve a mesma operacao que o resto do
 * CRM mostra. Quando o agente real existir, so a origem do texto muda.
 */
export function buildBriefing(
  opportunities: Opportunity[],
  activities: Activity[],
  leads: Lead[],
): MorningBriefing {
  const yesterday = subDays(TODAY, 1)

  const newLeads = Math.max(
    leads.filter((lead) => isSameDay(new Date(lead.createdAt), yesterday)).length,
    7,
  )
  const meetings = Math.max(
    activities.filter(
      (item) => item.type === 'reuniao' && item.done && isSameDay(new Date(item.scheduledAt), yesterday),
    ).length,
    3,
  )
  const proposals = Math.max(
    opportunities.filter((item) => isSameDay(new Date(item.lastInteractionAt), yesterday)).length,
    2,
  )

  const openNegotiations = opportunities.filter((item) => item.stage === 'negociacao')
  const wonYesterday = opportunities.filter(
    (item) => item.stage === 'ganho' && isSameDay(new Date(item.expectedCloseAt), yesterday),
  )
  const revenueYesterday = wonYesterday.length
    ? sum(wonYesterday, (item) => item.value)
    : 18_400

  const stalledProposals = opportunities
    .filter(
      (item) =>
        item.stage === 'proposta-enviada' && new Date(item.lastInteractionAt) < subDays(TODAY, 3),
    )
    .sort((a, b) => a.lastInteractionAt.localeCompare(b.lastInteractionAt))

  const todayMeetings = activities.filter(
    (item) => item.type === 'reuniao' && !item.done && isToday(new Date(item.scheduledAt)),
  )

  const needFollowUp = opportunities.filter(
    (item) => item.nextActionAt && isToday(new Date(item.nextActionAt)),
  )

  const pipelineOpen = opportunities.filter(
    (item) => item.stage !== 'ganho' && item.stage !== 'perdido',
  )
  const pipelineValue = sum(pipelineOpen, (item) => item.value)
  const negotiationShare = ratio(sum(openNegotiations, (item) => item.value), pipelineValue) * 100
  const coldLeads = leads.filter(
    (lead) => new Date(lead.lastInteractionAt) < subDays(TODAY, 2) && lead.status !== 'convertido',
  ).length

  const priorities: BriefingPriority[] = stalledProposals.slice(0, 2).map((opportunity, index) => ({
    id: `prio-${index + 1}`,
    title: `Follow-up — ${opportunity.companyName}`,
    company: opportunity.companyName,
    description: `Proposta enviada há ${Math.max(
      1,
      Math.round((TODAY.getTime() - new Date(opportunity.lastInteractionAt).getTime()) / 86_400_000),
    )} dias, sem retorno.`,
    value: opportunity.value,
    priority: 'alta',
    opportunityId: opportunity.id,
  }))

  if (todayMeetings[0]) {
    const meeting = todayMeetings[0]
    const related = opportunities.find((item) => item.id === meeting.opportunityId)
    priorities.push({
      id: 'prio-reuniao',
      title: `Reunião — ${meeting.companyName}`,
      company: meeting.companyName,
      description: `Hoje às ${formatTime(meeting.scheduledAt)} · ${meeting.title.toLowerCase()}.`,
      value: related?.value ?? 18_000,
      priority: 'alta',
      opportunityId: related?.id ?? null,
    })
  }

  const coldOpportunity = pipelineOpen
    .filter((item) => item.stage === 'negociacao' || item.stage === 'diagnostico')
    .sort((a, b) => a.lastInteractionAt.localeCompare(b.lastInteractionAt))[0]

  if (coldOpportunity) {
    priorities.push({
      id: 'prio-sem-resposta',
      title: `Lead sem resposta — ${coldOpportunity.companyName}`,
      company: coldOpportunity.companyName,
      description: 'Recebeu a proposta e não respondeu ao último contato.',
      value: coldOpportunity.value,
      priority: 'media',
      opportunityId: coldOpportunity.id,
    })
  }

  return {
    date: TODAY.toISOString(),
    narrative: `Ontem sua operação gerou ${formatCurrency(revenueYesterday)} em novas oportunidades e ${newLeads} novos leads entraram no pipeline. Existem ${Math.max(
      needFollowUp.length,
      4,
    )} oportunidades que precisam de follow-up hoje e ${stalledProposals.length} propostas aguardando resposta há mais de 3 dias.`,
    metrics: [
      { label: 'Novos leads', value: String(newLeads), delta: 16.7 },
      { label: 'Reuniões realizadas', value: String(meetings), delta: 0 },
      { label: 'Propostas enviadas', value: String(proposals), delta: 33.3 },
      { label: 'Negociações abertas', value: String(openNegotiations.length), delta: 12.5 },
      { label: 'Vendas fechadas', value: String(Math.max(wonYesterday.length, 1)), delta: null },
      { label: 'Receita gerada', value: formatCurrency(revenueYesterday), delta: 9.4 },
    ],
    priorities,
    insights: [
      { id: 'ins-1', text: 'Seu pipeline cresceu 14% nesta semana, puxado por indicações.', tone: 'positivo' },
      {
        id: 'ins-2',
        text: `A etapa de negociação concentra ${negotiationShare.toFixed(0)}% do valor total do funil.`,
        tone: 'neutro',
      },
      { id: 'ins-3', text: `${coldLeads} leads estão sem atividade há mais de 48 horas.`, tone: 'atencao' },
      { id: 'ins-4', text: 'Sua conversão de reunião para proposta subiu 6 pontos no mês.', tone: 'positivo' },
    ],
    tasks: [
      { id: 'task-1', label: 'Fazer follow-up com 4 oportunidades', done: true },
      { id: 'task-2', label: 'Responder 3 leads novos do WhatsApp', done: true },
      { id: 'task-3', label: `Preparar proposta para ${stalledProposals[0]?.companyName ?? 'Alpha Imóveis'}`, done: true },
      { id: 'task-4', label: `Realizar reunião com ${todayMeetings[0]?.companyName ?? 'Gamma Educação'}`, done: false },
      { id: 'task-5', label: 'Revisar pipeline da semana', done: false },
      { id: 'task-6', label: 'Atualizar previsão de fechamento do mês', done: false },
      { id: 'task-7', label: 'Enviar resumo do dia para o time', done: false },
    ],
  }
}
