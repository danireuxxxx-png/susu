/**
 * Implementação do contrato do CRM contra a API real.
 *
 * O `bootstrap` monta o snapshot que as telas esperam com um punhado de
 * chamadas paralelas; as mutações vão direto ao endpoint correspondente.
 * Nenhum componente sabe que a origem mudou.
 */
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type {
  Activity,
  Goal,
  Lead,
  MorningBriefing,
  Opportunity,
  PipelineStageId,
  TimelineEvent,
} from '@/types'
import type { CrmSnapshot } from './crm.service'
import type { DailyRevenuePoint } from '@/mock/finance'
import { api, fetchAll } from './http'
import {
  buildStageMap,
  toActivity,
  toCompany,
  toCustomer,
  toLead,
  toNotification,
  toOpportunity,
  toTeamMember,
  type ApiActivity,
  type ApiCompany,
  type ApiContact,
  type ApiInsight,
  type ApiLead,
  type ApiMember,
  type ApiNotification,
  type ApiOpportunity,
  type ApiProfitability,
  type ApiProject,
  type ApiStage,
} from './mappers'

interface ApiHistoryPoint {
  month: string
  mrr: string
  total_monthly_cost: string
}

interface ApiDailyPoint {
  day: string
  billed: string
}

interface ApiGoalProgress {
  id: string
  type: string
  label: string
  description: string | null
  period_start: string
  target_value: string
  current_value: string
}

interface ApiInteraction {
  id: string
  opportunity_id: string | null
  channel: string
  direction: string
  content: string | null
  occurred_at: string
}

interface ApiDailyBrief {
  brief_date: string
  summary: string | null
  metrics: Record<string, number>
  insights: { text: string; tone?: string }[]
  priorities: { title: string; value?: number; priority?: string; company?: string }[]
}

const number = (value: string | number | null | undefined) => Number(value ?? 0)

/**
 * Identificadores do funil resolvidos no bootstrap.
 *
 * As telas falam em etapas fixas ("proposta-enviada"); o banco usa UUIDs
 * de um pipeline configurável. Este mapa faz a ponte nas mutações.
 */
export const apiContext = {
  pipelineId: '',
  stageIdByFrontend: new Map<PipelineStageId, string>(),
}

const GOAL_UNIT: Record<string, Goal['unit']> = {
  REVENUE: 'BRL',
  MRR: 'BRL',
  PROFIT: 'BRL',
  MARGIN: 'percentual',
  CONVERSIONS: 'unidade',
  NEW_CLIENTS: 'unidade',
  MEETINGS: 'unidade',
  PROPOSALS: 'unidade',
  PIPELINE: 'BRL',
}

export async function bootstrapFromApi(): Promise<CrmSnapshot> {
  const [
    companies,
    contacts,
    leads,
    opportunities,
    stages,
    activities,
    projects,
    profitability,
    insights,
    interactions,
    members,
    me,
    notifications,
    history,
    daily,
    goalsProgress,
    brief,
  ] = await Promise.all([
    fetchAll<ApiCompany>('/companies'),
    fetchAll<ApiContact>('/contacts'),
    fetchAll<ApiLead>('/leads'),
    fetchAll<ApiOpportunity>('/opportunities'),
    fetchAll<ApiStage>('/pipeline-stages'),
    fetchAll<ApiActivity>('/activities'),
    fetchAll<ApiProject>('/projects'),
    api.get<ApiProfitability[]>('/financial/customer-profitability?limit=200'),
    fetchAll<ApiInsight>('/customer-insights'),
    fetchAll<ApiInteraction>('/interactions'),
    api.get<ApiMember[]>('/organizations/current/members'),
    api.get<{ user: { id: string; name: string; email: string }; role: string }>('/auth/me'),
    fetchAll<ApiNotification>('/notifications', 2),
    api.get<ApiHistoryPoint[]>('/financial/history?months=12'),
    api.get<ApiDailyPoint[]>('/financial/revenue-daily?days=120'),
    api.get<ApiGoalProgress[]>('/goals/progress'),
    api.get<ApiDailyBrief | null>('/daily-brief/latest'),
  ])

  const companyName = new Map(companies.map((company) => [company.id, company.trade_name]))
  const contactsByCompany = new Map<string, ApiContact[]>()
  for (const contact of contacts) {
    if (!contact.company_id) continue
    const list = contactsByCompany.get(contact.company_id) ?? []
    list.push(contact)
    contactsByCompany.set(contact.company_id, list)
  }

  const insightsByCompany = new Map<string, ApiInsight[]>()
  for (const insight of insights) {
    if (!insight.company_id) continue
    const list = insightsByCompany.get(insight.company_id) ?? []
    list.push(insight)
    insightsByCompany.set(insight.company_id, list)
  }

  const economicsByCompany = new Map(profitability.map((row) => [row.company_id, row]))
  const projectsByCompany = new Map<string, ApiProject[]>()
  for (const project of projects) {
    const list = projectsByCompany.get(project.company_id) ?? []
    list.push(project)
    projectsByCompany.set(project.company_id, list)
  }

  // Timeline da oportunidade: interações reais + atividades concluídas.
  const timelineByOpportunity = new Map<string, TimelineEvent[]>()
  const pushTimeline = (opportunityId: string, event: TimelineEvent) => {
    const list = timelineByOpportunity.get(opportunityId) ?? []
    list.push(event)
    timelineByOpportunity.set(opportunityId, list)
  }

  for (const interaction of interactions) {
    if (!interaction.opportunity_id) continue
    pushTimeline(interaction.opportunity_id, {
      id: interaction.id,
      type: interaction.channel === 'WHATSAPP' ? 'whatsapp' : interaction.channel === 'EMAIL' ? 'email' : 'ligacao',
      title: interaction.direction === 'INBOUND' ? 'Mensagem recebida' : 'Mensagem enviada',
      description: interaction.content ?? '',
      date: interaction.occurred_at,
      authorId: '',
    })
  }

  for (const activity of activities) {
    if (!activity.opportunity_id || activity.status !== 'DONE') continue
    pushTimeline(activity.opportunity_id, {
      id: activity.id,
      type: 'tarefa',
      title: activity.title,
      description: activity.notes ?? '',
      date: activity.scheduled_at ?? new Date().toISOString(),
      authorId: activity.owner_id ?? '',
    })
  }

  for (const list of timelineByOpportunity.values()) {
    list.sort((a, b) => b.date.localeCompare(a.date))
  }

  const stageMap = buildStageMap(stages)
  apiContext.stageIdByFrontend = new Map(
    [...stageMap.entries()].map(([stageId, frontendId]) => [frontendId, stageId]),
  )
  apiContext.pipelineId = opportunities[0]?.pipeline_id ?? ''

  const contactName = new Map(contacts.map((contact) => [contact.id, contact.name]))

  const mappedCompanies = companies.map((company) =>
    toCompany(
      company,
      contactsByCompany.get(company.id) ?? [],
      economicsByCompany.get(company.id),
      insightsByCompany.get(company.id) ?? [],
    ),
  )

  const customers = profitability
    .filter((row) => row.projects_total > 0)
    .map((row) =>
      toCustomer(
        row,
        projectsByCompany.get(row.company_id) ?? [],
        contactsByCompany.get(row.company_id)?.find((contact) => contact.is_primary)?.name ?? '—',
      ),
    )

  const goalTarget = goalsProgress.find((goal) => goal.type === 'REVENUE')?.target_value

  const monthly = history.map((point) => ({
    month: point.month.slice(0, 7),
    label: format(parseISO(point.month), 'MMM', { locale: ptBR }).replace('.', ''),
    revenue: number(point.mrr),
    cost: number(point.total_monthly_cost),
    goal: number(goalTarget),
  }))

  // A API devolve só os dias com faturamento. O gráfico precisa da linha
  // do tempo inteira, senão dois pontos distantes viram um platô que não
  // existiu: os dias sem receita entram com zero.
  const billedByDay = new Map(daily.map((point) => [point.day.slice(0, 10), number(point.billed)]))
  const dailyPoints: DailyRevenuePoint[] = Array.from({ length: 120 }, (_, index) => {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - (119 - index))
    const key = date.toISOString().slice(0, 10)
    return {
      date: date.toISOString(),
      label: format(date, 'dd MMM', { locale: ptBR }).replace('.', ''),
      revenue: billedByDay.get(key) ?? 0,
    }
  })

  const goals: Goal[] = goalsProgress.map((goal) => ({
    id: goal.id,
    label: goal.label,
    description: goal.description ?? '',
    current: number(goal.current_value),
    target: number(goal.target_value),
    unit: GOAL_UNIT[goal.type] ?? 'unidade',
    period: format(parseISO(goal.period_start), 'MMMM yyyy', { locale: ptBR }),
  }))

  const todayTasks = activities
    .filter((activity) => activity.status === 'PLANNED')
    .slice(0, 7)
    .map((activity) => ({ id: activity.id, label: activity.title, done: false }))

  const briefing: MorningBriefing = {
    date: brief?.brief_date ?? new Date().toISOString(),
    narrative: brief?.summary ?? 'Nenhum briefing gerado ainda para hoje.',
    metrics: Object.entries(brief?.metrics ?? {}).map(([label, value]) => ({
      label,
      value: String(value),
      delta: null,
    })),
    priorities: (brief?.priorities ?? []).map((priority, index) => ({
      id: `prio-${index}`,
      title: priority.title,
      company: priority.company ?? '',
      description: '',
      value: Number(priority.value ?? 0),
      priority: priority.priority === 'HIGH' ? 'alta' : 'media',
      opportunityId: null,
    })),
    insights: (brief?.insights ?? []).map((insight, index) => ({
      id: `insight-${index}`,
      text: insight.text,
      tone: insight.tone === 'positive' ? 'positivo' : insight.tone === 'warning' ? 'atencao' : 'neutro',
    })),
    tasks: todayTasks,
  }

  const team = members.map(toTeamMember)
  const currentUser =
    team.find((member) => member.id === me.user.id) ??
    ({ id: me.user.id, name: me.user.name, role: me.role, email: me.user.email, avatarColor: 'accent' } as const)

  return {
    companies: mappedCompanies,
    customers,
    opportunities: opportunities.map((opportunity) =>
      toOpportunity(
        opportunity,
        stageMap,
        companyName.get(opportunity.company_id ?? '') ?? '—',
        contactName.get(opportunity.contact_id ?? '') ?? '—',
        timelineByOpportunity.get(opportunity.id) ?? [],
      ),
    ),
    leads: leads.map((lead) => toLead(lead, companyName.get(lead.company_id ?? '') ?? '—')),
    activities: activities.map((activity) =>
      toActivity(activity, companyName.get(activity.company_id ?? '') ?? 'Interno'),
    ),
    goals,
    finance: {
      monthly,
      daily: dailyPoints,
      byCustomer: profitability.map((row) => ({
        customerId: row.company_id,
        companyName: row.company_name,
        revenue: number(row.monthly_revenue),
        cost: number(row.monthly_cost),
      })),
    },
    briefing,
    notifications: notifications.map(toNotification),
    team,
    currentUser,
  }
}

// ---------------------------------------------------------------------
// Mutações — cada uma chama o endpoint equivalente e devolve o que a
// store precisa. O backend continua sendo a fonte da verdade.
// ---------------------------------------------------------------------

const SOURCE_TO_API: Record<string, string> = {
  whatsapp: 'WHATSAPP',
  instagram: 'INSTAGRAM',
  indicacao: 'REFERRAL',
  site: 'WEBSITE',
  outbound: 'OUTBOUND',
  outros: 'OTHER',
}

const LEAD_STATUS_TO_API: Record<string, string> = {
  novo: 'NEW',
  'em-qualificacao': 'QUALIFYING',
  qualificado: 'QUALIFIED',
  'sem-contato': 'CONTACTED',
  convertido: 'CONVERTED',
  perdido: 'LOST',
}

const PRIORITY_TO_API: Record<string, string> = { baixa: 'LOW', media: 'MEDIUM', alta: 'HIGH' }

export async function saveLeadOnApi(lead: Lead, exists: boolean): Promise<Lead> {
  const payload = {
    name: lead.name,
    companyId: lead.companyId || undefined,
    jobTitle: lead.role,
    email: lead.email || undefined,
    phone: lead.whatsapp || undefined,
    source: SOURCE_TO_API[lead.source],
    status: LEAD_STATUS_TO_API[lead.status],
    estimatedValue: lead.potentialValue,
    notes: lead.notes || undefined,
  }

  const saved = exists
    ? await api.patch<ApiLead>(`/leads/${lead.id}`, payload)
    : await api.post<ApiLead>('/leads', payload)

  return toLead(saved, lead.companyName)
}

export async function deleteLeadOnApi(id: string) {
  await api.delete(`/leads/${id}`)
}

export async function saveOpportunityOnApi(
  opportunity: Opportunity,
  exists: boolean,
  stageIdByFrontend: Map<PipelineStageId, string>,
  pipelineId: string,
): Promise<Opportunity> {
  const payload = {
    pipelineId,
    stageId: stageIdByFrontend.get(opportunity.stage),
    companyId: opportunity.companyId || undefined,
    contactId: opportunity.contactId || undefined,
    title: opportunity.title,
    value: opportunity.value,
    probability: opportunity.probability,
    priority: PRIORITY_TO_API[opportunity.priority],
    source: SOURCE_TO_API[opportunity.source],
    expectedCloseAt: undefined,
    nextActionLabel: opportunity.nextActionLabel ?? undefined,
  }

  const saved = exists
    ? await api.patch<ApiOpportunity>(`/opportunities/${opportunity.id}`, payload)
    : await api.post<ApiOpportunity>('/opportunities', payload)

  return { ...opportunity, id: saved.id, value: number(saved.value) }
}

export async function moveOpportunityOnApi(id: string, stageId: string) {
  await api.post(`/opportunities/${id}/stage`, { stageId })
}

export async function deleteOpportunityOnApi(id: string) {
  await api.delete(`/opportunities/${id}`)
}

export async function saveActivityOnApi(activity: Activity, exists: boolean): Promise<Activity> {
  const payload = {
    title: activity.title,
    companyId: activity.companyId || undefined,
    opportunityId: activity.opportunityId ?? undefined,
    scheduledAt: activity.scheduledAt,
    durationMinutes: activity.durationMinutes,
    notes: activity.notes || undefined,
    status: activity.done ? 'DONE' : 'PLANNED',
    completedAt: activity.done ? new Date().toISOString() : undefined,
  }

  const saved = exists
    ? await api.patch<ApiActivity>(`/activities/${activity.id}`, payload)
    : await api.post<ApiActivity>('/activities', payload)

  return { ...activity, id: saved.id }
}

export async function readNotificationOnApi(id: string) {
  await api.post(`/notifications/${id}/read`)
}

export async function readAllNotificationsOnApi() {
  await api.post('/notifications/read-all')
}

export async function saveGoalOnApi(goal: Goal): Promise<Goal> {
  await api.patch(`/goals/${goal.id}`, { targetValue: goal.target })
  return goal
}
