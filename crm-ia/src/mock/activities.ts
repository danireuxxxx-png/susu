import { addDays, setHours, setMinutes, subDays } from 'date-fns'
import type { Activity, ActivityType, Opportunity } from '@/types'
import { TODAY, type Rng } from './seed'
import { TEAM } from './team'

const TITLES: Record<ActivityType, string[]> = {
  ligacao: ['Ligação de qualificação', 'Ligação de alinhamento', 'Retorno de ligação'],
  whatsapp: ['Mensagem de follow-up', 'Envio de material por WhatsApp', 'Confirmação de reunião'],
  email: ['Envio de proposta', 'Resumo da reunião por e-mail', 'Envio de contrato'],
  reuniao: ['Reunião de diagnóstico', 'Demo da solução', 'Reunião de fechamento'],
  'follow-up': ['Follow-up de proposta', 'Follow-up de negociação', 'Follow-up pós-reunião'],
  tarefa: ['Montar escopo técnico', 'Revisar proposta', 'Preparar apresentação'],
}

function at(date: Date, hour: number, minute = 0) {
  return setMinutes(setHours(date, hour), minute)
}

/**
 * Agenda de hoje fixa — o briefing matinal e o dashboard citam estes horarios,
 * entao eles precisam existir de verdade na base.
 */
function buildTodayAgenda(opportunities: Opportunity[]): Activity[] {
  const highlighted = opportunities.filter((item) => item.stage !== 'perdido').slice(0, 4)
  const plan: { type: ActivityType; title: string; hour: number; minute: number; duration: number; done: boolean }[] = [
    { type: 'reuniao', title: 'Reunião de diagnóstico', hour: 9, minute: 0, duration: 60, done: true },
    { type: 'follow-up', title: 'Follow-up de proposta', hour: 11, minute: 0, duration: 20, done: true },
    { type: 'reuniao', title: 'Demo da solução', hour: 14, minute: 0, duration: 45, done: false },
    { type: 'email', title: 'Envio de proposta', hour: 16, minute: 30, duration: 30, done: false },
  ]

  return plan.map((item, index) => {
    const opportunity = highlighted[index]!
    return {
      id: `atv-hoje-${index + 1}`,
      type: item.type,
      title: item.title,
      companyId: opportunity.companyId,
      companyName: opportunity.companyName,
      opportunityId: opportunity.id,
      ownerId: opportunity.ownerId,
      scheduledAt: at(TODAY, item.hour, item.minute).toISOString(),
      durationMinutes: item.duration,
      done: item.done,
      notes: `Relacionado a ${opportunity.title.toLowerCase()}.`,
    }
  })
}

export function buildActivities(rng: Rng, opportunities: Opportunity[]): Activity[] {
  const activities = buildTodayAgenda(opportunities)
  const types: ActivityType[] = ['ligacao', 'whatsapp', 'email', 'reuniao', 'follow-up', 'tarefa']

  opportunities.forEach((opportunity, index) => {
    // Uma atividade passada (executada) e, para oportunidades abertas, uma futura.
    const pastType = rng.pick(types)
    activities.push({
      id: `atv-p-${String(index + 1).padStart(2, '0')}`,
      type: pastType,
      title: rng.pick(TITLES[pastType]),
      companyId: opportunity.companyId,
      companyName: opportunity.companyName,
      opportunityId: opportunity.id,
      ownerId: opportunity.ownerId,
      scheduledAt: at(subDays(TODAY, rng.int(1, 12)), rng.int(9, 18), rng.pick([0, 30])).toISOString(),
      durationMinutes: rng.pick([20, 30, 45, 60]),
      done: true,
      notes: `Histórico de ${opportunity.companyName}.`,
    })

    if (opportunity.stage === 'ganho' || opportunity.stage === 'perdido') return

    const futureType = rng.pick(types)
    activities.push({
      id: `atv-f-${String(index + 1).padStart(2, '0')}`,
      type: futureType,
      title: rng.pick(TITLES[futureType]),
      companyId: opportunity.companyId,
      companyName: opportunity.companyName,
      opportunityId: opportunity.id,
      ownerId: opportunity.ownerId,
      scheduledAt: at(addDays(TODAY, rng.int(1, 14)), rng.int(9, 18), rng.pick([0, 30])).toISOString(),
      durationMinutes: rng.pick([20, 30, 45, 60]),
      done: false,
      notes: opportunity.nextActionLabel ?? 'Próximo passo da oportunidade.',
    })
  })

  // Tarefas internas do time, sem oportunidade vinculada.
  for (let index = 0; index < 6; index += 1) {
    const member = TEAM[rng.int(0, TEAM.length - 1)]!
    activities.push({
      id: `atv-t-${index + 1}`,
      type: 'tarefa',
      title: rng.pick(TITLES.tarefa),
      companyId: '',
      companyName: 'Interno',
      opportunityId: null,
      ownerId: member.id,
      scheduledAt: at(addDays(TODAY, rng.int(0, 9)), rng.int(9, 18), rng.pick([0, 30])).toISOString(),
      durationMinutes: 30,
      done: false,
      notes: 'Tarefa interna do time comercial.',
    })
  }

  return activities.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}
