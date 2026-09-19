import { addHours, subDays } from 'date-fns'
import type { Company, Lead, LeadSource, LeadStatus } from '@/types'
import { CONTACT_ROLES, FIRST_NAMES, LAST_NAMES, TODAY, type Rng } from './seed'
import { TEAM } from './team'

/** Mix de status pensado para as abas da tela de Leads terem volume real. */
const STATUS_MIX: LeadStatus[] = [
  ...Array.from({ length: 12 }, () => 'novo' as const),
  ...Array.from({ length: 11 }, () => 'em-qualificacao' as const),
  ...Array.from({ length: 9 }, () => 'qualificado' as const),
  ...Array.from({ length: 8 }, () => 'sem-contato' as const),
  ...Array.from({ length: 6 }, () => 'convertido' as const),
  ...Array.from({ length: 4 }, () => 'perdido' as const),
]

const SOURCE_MIX: LeadSource[] = [
  'whatsapp', 'whatsapp', 'whatsapp', 'whatsapp', 'instagram', 'instagram', 'instagram',
  'indicacao', 'indicacao', 'site', 'site', 'outbound', 'outros',
]

const NOTES = [
  'Pediu apresentação comercial pelo WhatsApp.',
  'Baixou o material sobre agentes de IA no site.',
  'Indicado por cliente da carteira.',
  'Respondeu campanha de outbound no LinkedIn.',
  'Quer automatizar o atendimento antes do fim do trimestre.',
  'Solicitou proposta para dois departamentos.',
  'Chegou pelo Instagram após post sobre automação.',
  'Sem resposta desde o primeiro contato.',
]

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

export function buildLeads(rng: Rng, companies: Company[]): Lead[] {
  return STATUS_MIX.map((status, index) => {
    const company = companies[rng.int(0, companies.length - 1)]!
    const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`
    // Curva enviesada para os dias recentes: a base cresce ao longo do tempo.
    const createdAt = subDays(TODAY, Math.floor(rng.next() ** 1.25 * 60))
    const lastInteractionAt = addHours(
      subDays(TODAY, status === 'sem-contato' ? rng.int(3, 21) : rng.int(0, 6)),
      rng.int(9, 19),
    )

    return {
      id: `lead-${String(index + 1).padStart(2, '0')}`,
      name,
      companyId: company.id,
      companyName: company.tradeName,
      role: rng.pick(CONTACT_ROLES),
      email: `${slugify(name.split(' ')[0]!)}@${slugify(company.tradeName)}.com.br`,
      whatsapp: `+55 (${rng.int(11, 85)}) 9${rng.int(1000, 9999)}-${rng.int(1000, 9999)}`,
      source: rng.pick(SOURCE_MIX),
      status,
      potentialValue: rng.money(4000, 26000, 500),
      ownerId: TEAM[rng.int(0, TEAM.length - 1)]!.id,
      createdAt: createdAt.toISOString(),
      lastInteractionAt: (lastInteractionAt > createdAt ? lastInteractionAt : createdAt).toISOString(),
      notes: rng.pick(NOTES),
    }
  })
}
