import { addDays, addHours, subDays } from 'date-fns'
import type { Company, LeadSource, Opportunity, PipelineStageId, Priority, TimelineEvent } from '@/types'
import { PIPELINE_STAGES, STAGE_BY_ID } from '@/constants/pipeline'
import { LOST_REASONS, PROJECT_TITLES, TODAY, type Rng } from './seed'
import { TEAM } from './team'

/** Quantas oportunidades vivem em cada etapa — desenha o formato do funil. */
const STAGE_DISTRIBUTION: Record<PipelineStageId, number> = {
  'novo-lead': 4,
  qualificacao: 4,
  'reuniao-agendada': 4,
  diagnostico: 3,
  'proposta-enviada': 4,
  negociacao: 3,
  ganho: 4,
  perdido: 14,
}

const SOURCES: LeadSource[] = ['whatsapp', 'instagram', 'indicacao', 'site', 'outbound', 'outros']
const SOURCE_WEIGHTS: LeadSource[] = [
  'whatsapp', 'whatsapp', 'whatsapp', 'instagram', 'instagram', 'indicacao', 'indicacao',
  'site', 'site', 'outbound', 'outros',
]

const NEXT_ACTIONS: Record<PipelineStageId, string | null> = {
  'novo-lead': 'Primeiro contato por WhatsApp',
  qualificacao: 'Ligação de qualificação',
  'reuniao-agendada': 'Reunião de diagnóstico',
  diagnostico: 'Montar escopo da solução',
  'proposta-enviada': 'Follow-up da proposta',
  negociacao: 'Alinhar condições comerciais',
  ganho: 'Kickoff de implantação',
  perdido: null,
}

/** Historico coerente: a timeline cresce conforme a etapa avanca. */
function buildTimeline(rng: Rng, stage: PipelineStageId, createdAt: Date, ownerId: string): TimelineEvent[] {
  const stageIndex = PIPELINE_STAGES.findIndex((item) => item.id === stage)
  const events: TimelineEvent[] = []
  let cursor = createdAt

  const push = (type: TimelineEvent['type'], title: string, description: string, daysAhead: number) => {
    cursor = addDays(cursor, daysAhead)
    if (cursor > TODAY) cursor = subDays(TODAY, rng.int(0, 2))
    cursor = addHours(cursor, rng.int(9, 18) - cursor.getHours())
    events.push({
      id: `evt-${events.length + 1}-${cursor.getTime()}`,
      type,
      title,
      description,
      date: cursor.toISOString(),
      authorId: ownerId,
    })
  }

  push('criacao', 'Lead criado', 'Oportunidade registrada no pipeline.', 0)
  push('whatsapp', 'WhatsApp recebido', 'Cliente pediu informações sobre agentes de IA.', rng.int(0, 2))

  if (stageIndex >= 1) push('ligacao', 'Ligação de qualificação', 'Confirmado orçamento, decisor e prazo.', rng.int(1, 3))
  if (stageIndex >= 2) push('reuniao', 'Reunião marcada', 'Agenda enviada e confirmada pelo cliente.', rng.int(1, 4))
  if (stageIndex >= 3) push('reuniao', 'Reunião realizada', 'Levantamento de processos e dores atuais.', rng.int(2, 5))
  if (stageIndex >= 4) push('email', 'Proposta enviada', 'Escopo, cronograma e investimento enviados por e-mail.', rng.int(1, 4))
  if (stageIndex >= 5) push('follow-up', 'Follow-up realizado', 'Cliente pediu ajuste de escopo e novo prazo.', rng.int(2, 5))

  if (stage === 'ganho') {
    push('estagio', 'Proposta aprovada', 'Contrato assinado e kickoff agendado.', rng.int(1, 4))
  }
  if (stage === 'perdido') {
    push('estagio', 'Oportunidade perdida', rng.pick(LOST_REASONS), rng.int(2, 8))
  }

  return events.reverse()
}

export function buildOpportunities(rng: Rng, companies: Company[]): Opportunity[] {
  const opportunities: Opportunity[] = []
  let sequence = 1

  for (const stage of PIPELINE_STAGES) {
    const total = STAGE_DISTRIBUTION[stage.id]

    for (let index = 0; index < total; index += 1) {
      // Empresas 0-19 sao clientes (expansao); 20-29 sao prospects novos.
      const company = companies[rng.int(index % 2 === 0 ? 20 : 0, index % 2 === 0 ? 29 : 19)]!
      const contact = company.contacts[0]!
      const ownerId = TEAM[rng.int(0, TEAM.length - 1)]!.id
      const isWon = stage.id === 'ganho'
      const createdAt = subDays(TODAY, isWon ? rng.int(28, 70) : rng.int(3, 95))
      const value = isWon ? rng.money(8000, 18000, 500) : rng.money(6000, 32000, 500)
      const priority: Priority =
        value >= 22000 ? 'alta' : value >= 13000 ? 'media' : rng.pick(['baixa', 'media'] as const)

      // Ganhos fecham dentro do mes corrente: o financeiro consome esse valor.
      const expectedCloseAt = isWon
        ? subDays(TODAY, rng.int(1, 18))
        : stage.id === 'perdido'
          ? subDays(TODAY, rng.int(2, 30))
          : addDays(TODAY, rng.int(3, 75))

      const nextActionLabel = NEXT_ACTIONS[stage.id]
      const timeline = buildTimeline(rng, stage.id, createdAt, ownerId)

      // Negocio aberto nao fica meses sem toque: desloca a timeline inteira
      // para que a ultima interacao caia nos ultimos dias, preservando o
      // espacamento entre os eventos.
      if (stage.kind === 'aberto') {
        const newest = new Date(timeline[0]!.date)
        const target = subDays(TODAY, rng.int(1, 9))
        const offset = target.getTime() - newest.getTime()
        if (offset > 0) {
          for (const event of timeline) {
            event.date = new Date(new Date(event.date).getTime() + offset).toISOString()
          }
        }
      }

      opportunities.push({
        id: `opo-${String(sequence).padStart(2, '0')}`,
        title: rng.pick(PROJECT_TITLES),
        companyId: company.id,
        companyName: company.tradeName,
        contactId: contact.id,
        contactName: contact.name,
        value,
        stage: stage.id,
        probability: Math.min(99, Math.max(1, STAGE_BY_ID[stage.id].probability + rng.int(-6, 6))),
        priority,
        source: rng.pick(SOURCE_WEIGHTS),
        ownerId,
        createdAt: createdAt.toISOString(),
        expectedCloseAt: expectedCloseAt.toISOString(),
        nextActionAt: nextActionLabel ? addHours(addDays(TODAY, rng.int(0, 6)), rng.int(9, 17)).toISOString() : null,
        nextActionLabel,
        lastInteractionAt: timeline[0]!.date,
        timeline,
      })
      sequence += 1
    }
  }

  return opportunities
}

export { SOURCES }
