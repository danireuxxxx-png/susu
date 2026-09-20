/**
 * Tradução entre o modelo da API e os tipos que as telas já usam.
 *
 * O backend é mais rico que o modelo do frontend (ele conhece projetos,
 * custos e rentabilidade). Onde o frontend pede um campo que não existe
 * lá, o mapeamento usa a melhor aproximação disponível — e diz qual é.
 */
import type {
  Activity,
  ActivityType,
  Company,
  CompanySize,
  Contact,
  Customer,
  CustomerStatus,
  Lead,
  LeadSource,
  LeadStatus,
  NotificationItem,
  Opportunity,
  PipelineStageId,
  Priority,
  TeamMember,
  TimelineEvent,
} from '@/types'
import { PIPELINE_STAGES } from '@/constants/pipeline'

export interface ApiCompany {
  id: string
  trade_name: string
  legal_name: string | null
  document: string | null
  industry: string | null
  company_size: string | null
  website: string | null
  city: string | null
  state: string | null
  employees: number | null
  created_at: string
  owner_id: string | null
}

export interface ApiContact {
  id: string
  company_id: string | null
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  job_title: string | null
  is_primary: boolean
}

export interface ApiLead {
  id: string
  company_id: string | null
  name: string
  email: string | null
  phone: string | null
  job_title: string | null
  source: string
  status: string
  estimated_value: string
  owner_id: string | null
  created_at: string
  last_contact_at: string | null
  notes: string | null
}

export interface ApiOpportunity {
  id: string
  pipeline_id: string
  stage_id: string
  company_id: string | null
  contact_id: string | null
  owner_id: string | null
  title: string
  description: string | null
  value: string
  probability: string
  priority: string
  source: string | null
  expected_close_date: string | null
  next_action_at: string | null
  next_action_label: string | null
  last_interaction_at: string | null
  created_at: string
}

export interface ApiStage {
  id: string
  name: string
  position: number
}

export interface ApiActivity {
  id: string
  type: string
  status: string
  title: string
  notes: string | null
  company_id: string | null
  opportunity_id: string | null
  owner_id: string | null
  scheduled_at: string | null
  duration_minutes: number | null
}

export interface ApiProfitability {
  company_id: string
  company_name: string
  projects_total: number
  projects_active: number
  monthly_revenue: string
  monthly_cost: string
  monthly_profit: string
  margin: string
  annual_revenue: string
  annual_cost: string
}

export interface ApiProject {
  id: string
  company_id: string
  name: string
  status: string
  start_date: string | null
  end_date: string | null
  monthly_revenue: string
  setup_revenue: string
  owner_id: string | null
}

export interface ApiInsight {
  company_id: string | null
  key: string
  value: string | null
  confidence: string | null
  updated_at: string
}

export interface ApiMember {
  user_id: string
  name: string
  email: string
  role: string
  avatar_url: string | null
}

export interface ApiNotification {
  id: string
  title: string
  description: string | null
  tone: string
  href: string | null
  read_at: string | null
  created_at: string
}

const number = (value: string | number | null | undefined) => Number(value ?? 0)

const SOURCE: Record<string, LeadSource> = {
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  REFERRAL: 'indicacao',
  WEBSITE: 'site',
  OUTBOUND: 'outbound',
  EVENT: 'outros',
  OTHER: 'outros',
}

const LEAD_STATUS: Record<string, LeadStatus> = {
  NEW: 'novo',
  CONTACTED: 'em-qualificacao',
  QUALIFYING: 'em-qualificacao',
  QUALIFIED: 'qualificado',
  UNQUALIFIED: 'perdido',
  CONVERTED: 'convertido',
  LOST: 'perdido',
}

const PRIORITY: Record<string, Priority> = {
  LOW: 'baixa',
  MEDIUM: 'media',
  HIGH: 'alta',
  URGENT: 'alta',
}

const SIZE: Record<string, CompanySize> = {
  MICRO: 'micro',
  SMALL: 'pequena',
  MEDIUM: 'media',
  LARGE: 'grande',
  ENTERPRISE: 'grande',
}

const ACTIVITY: Record<string, ActivityType> = {
  CALL: 'ligacao',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  MEETING: 'reuniao',
  FOLLOW_UP: 'follow-up',
  TASK: 'tarefa',
  NOTE: 'tarefa',
}

/** Sem contato há mais de 3 dias vira "sem-contato" na tela de leads. */
function resolveLeadStatus(lead: ApiLead): LeadStatus {
  const mapped = LEAD_STATUS[lead.status] ?? 'novo'
  if (mapped !== 'novo' && mapped !== 'em-qualificacao') return mapped

  const reference = lead.last_contact_at ?? lead.created_at
  const days = (Date.now() - new Date(reference).getTime()) / 86_400_000
  return days > 3 ? 'sem-contato' : mapped
}

/**
 * O funil do frontend tem oito etapas fixas; o do banco é configurável.
 * A ligação é pela posição, com o nome como reserva.
 */
export function buildStageMap(stages: ApiStage[]): Map<string, PipelineStageId> {
  const ordered = [...stages].sort((a, b) => a.position - b.position)
  const map = new Map<string, PipelineStageId>()

  ordered.forEach((stage, index) => {
    const byPosition = PIPELINE_STAGES[index]?.id
    const byName = PIPELINE_STAGES.find(
      (item) => item.label.toLowerCase() === stage.name.toLowerCase(),
    )?.id
    map.set(stage.id, byName ?? byPosition ?? 'novo-lead')
  })

  return map
}

export function toContact(contact: ApiContact): Contact {
  return {
    id: contact.id,
    name: contact.name,
    role: contact.job_title ?? '—',
    email: contact.email ?? '',
    whatsapp: contact.whatsapp ?? contact.phone ?? '',
    companyId: contact.company_id ?? '',
    isPrimary: contact.is_primary,
  }
}

export function toCompany(
  company: ApiCompany,
  contacts: ApiContact[],
  economics: ApiProfitability | undefined,
  insights: ApiInsight[],
): Company {
  const intelligenceKeys = new Map(insights.map((insight) => [insight.key, insight.value ?? '']))
  const budget = intelligenceKeys.get('budget')
  const budgetRange = budget?.match(/[\d.]+/g)?.map((value) => Number(value.replace(/\./g, '')))

  return {
    id: company.id,
    legalName: company.legal_name ?? company.trade_name,
    tradeName: company.trade_name,
    cnpj: company.document ?? '—',
    segment: company.industry ?? '—',
    size: SIZE[company.company_size ?? ''] ?? 'pequena',
    city: company.city ?? '—',
    state: company.state ?? '—',
    website: company.website ?? '—',
    employees: company.employees ?? 0,
    createdAt: company.created_at,
    contacts: contacts.map(toContact),
    mrr: number(economics?.monthly_revenue),
    contract: economics && economics.projects_active > 0 ? `${economics.projects_active} projeto(s) ativo(s)` : null,
    // Ticket médio do cliente = receita recorrente dividida pelos projetos.
    ticket: economics && economics.projects_total > 0
      ? Math.round(number(economics.monthly_revenue) / economics.projects_total)
      : 0,
    totalSold: number(economics?.annual_revenue),
    intelligence: insights.length
      ? {
          needs: (intelligenceKeys.get('needs') ?? '').split(';').map((item) => item.trim()).filter(Boolean),
          painPoints: (intelligenceKeys.get('pain_points') ?? '').split(';').map((item) => item.trim()).filter(Boolean),
          interest: intelligenceKeys.get('interests') ?? intelligenceKeys.get('needs') ?? '—',
          budgetMin: budgetRange?.[0] ?? 0,
          budgetMax: budgetRange?.[1] ?? budgetRange?.[0] ?? 0,
          deadlineDays: Number(intelligenceKeys.get('timeline')?.match(/\d+/)?.[0] ?? 30),
          temperature:
            intelligenceKeys.get('urgency')?.toLowerCase().includes('alta') ? 'quente' : 'morno',
          lastSyncedAt: insights[0]?.updated_at ?? new Date().toISOString(),
          confidence: Math.round(
            insights.reduce((total, insight) => total + number(insight.confidence), 0) / insights.length,
          ),
        }
      : null,
  }
}

export function toLead(lead: ApiLead, companyName: string): Lead {
  return {
    id: lead.id,
    name: lead.name,
    companyId: lead.company_id ?? '',
    companyName,
    role: lead.job_title ?? '—',
    email: lead.email ?? '',
    whatsapp: lead.phone ?? '',
    source: SOURCE[lead.source] ?? 'outros',
    status: resolveLeadStatus(lead),
    potentialValue: number(lead.estimated_value),
    ownerId: lead.owner_id ?? '',
    createdAt: lead.created_at,
    lastInteractionAt: lead.last_contact_at ?? lead.created_at,
    notes: lead.notes ?? '',
  }
}

export function toOpportunity(
  opportunity: ApiOpportunity,
  stageMap: Map<string, PipelineStageId>,
  companyName: string,
  contactName: string,
  timeline: TimelineEvent[] = [],
): Opportunity {
  return {
    id: opportunity.id,
    title: opportunity.title,
    companyId: opportunity.company_id ?? '',
    companyName,
    contactId: opportunity.contact_id ?? '',
    contactName,
    value: number(opportunity.value),
    stage: stageMap.get(opportunity.stage_id) ?? 'novo-lead',
    probability: number(opportunity.probability),
    priority: PRIORITY[opportunity.priority] ?? 'media',
    source: SOURCE[opportunity.source ?? 'OTHER'] ?? 'outros',
    ownerId: opportunity.owner_id ?? '',
    createdAt: opportunity.created_at,
    expectedCloseAt: opportunity.expected_close_date ?? opportunity.created_at,
    nextActionAt: opportunity.next_action_at,
    nextActionLabel: opportunity.next_action_label,
    lastInteractionAt: opportunity.last_interaction_at ?? opportunity.created_at,
    timeline,
  }
}

export function toActivity(activity: ApiActivity, companyName: string): Activity {
  return {
    id: activity.id,
    type: ACTIVITY[activity.type] ?? 'tarefa',
    title: activity.title,
    companyId: activity.company_id ?? '',
    companyName,
    opportunityId: activity.opportunity_id,
    ownerId: activity.owner_id ?? '',
    scheduledAt: activity.scheduled_at ?? new Date().toISOString(),
    durationMinutes: activity.duration_minutes ?? 30,
    done: activity.status === 'DONE',
    notes: activity.notes ?? '',
  }
}

/**
 * O "cliente" do frontend é a empresa com projeto.
 *
 * plan, startedAt e renovação saem dos projetos reais; a saúde da conta
 * usa a margem como indicador — é o sinal econômico que o backend tem.
 */
export function toCustomer(
  economics: ApiProfitability,
  projects: ApiProject[],
  primaryContact: string,
): Customer {
  const sorted = [...projects].sort((a, b) => number(b.monthly_revenue) - number(a.monthly_revenue))
  const main = sorted[0]
  const startDates = projects.map((project) => project.start_date).filter(Boolean) as string[]
  const startedAt = startDates.sort()[0] ?? new Date().toISOString()

  const status: CustomerStatus =
    economics.projects_active === 0
      ? projects.some((project) => project.status === 'ONBOARDING')
        ? 'onboarding'
        : 'churn'
      : economics.projects_active > 1
        ? 'expansao'
        : number(economics.margin) < 50
          ? 'risco'
          : 'ativo'

  return {
    id: economics.company_id,
    companyId: economics.company_id,
    companyName: economics.company_name,
    primaryContact,
    plan: main?.name ?? 'Sem projeto',
    mrr: number(economics.monthly_revenue),
    ltv: number(economics.annual_revenue),
    status,
    startedAt,
    lastInteractionAt: startedAt,
    renewalAt:
      main?.end_date ??
      new Date(new Date(startedAt).setFullYear(new Date(startedAt).getFullYear() + 1)).toISOString(),
    ownerId: main?.owner_id ?? '',
    healthScore: Math.min(100, Math.max(0, Math.round(number(economics.margin)))),
  }
}

export function toTeamMember(member: ApiMember, index: number): TeamMember {
  const colors = ['accent', 'blue', 'aqua', 'orange', 'magenta']
  return {
    id: member.user_id,
    name: member.name || member.email,
    role: member.role,
    email: member.email,
    avatarColor: colors[index % colors.length] ?? 'accent',
  }
}

export function toNotification(notification: ApiNotification): NotificationItem {
  const tone =
    notification.tone === 'SUCCESS'
      ? 'positivo'
      : notification.tone === 'WARNING'
        ? 'atencao'
        : notification.tone === 'CRITICAL'
          ? 'critico'
          : 'info'

  return {
    id: notification.id,
    title: notification.title,
    description: notification.description ?? '',
    createdAt: notification.created_at,
    read: Boolean(notification.read_at),
    tone,
    href: notification.href,
  }
}
