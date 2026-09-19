/**
 * Modelo de dominio do CRM.
 *
 * Os tipos abaixo descrevem o contrato que a futura API (REST/GraphQL) devera
 * devolver. Hoje eles sao alimentados pela camada de mock em `src/mock`, mas
 * nenhuma tela conhece essa origem: tudo passa por `src/services`.
 */

export type ID = string

export type PipelineStageId =
  | 'novo-lead'
  | 'qualificacao'
  | 'reuniao-agendada'
  | 'diagnostico'
  | 'proposta-enviada'
  | 'negociacao'
  | 'ganho'
  | 'perdido'

export type Priority = 'baixa' | 'media' | 'alta'

export type LeadSource = 'whatsapp' | 'instagram' | 'indicacao' | 'site' | 'outbound' | 'outros'

export type LeadStatus =
  | 'novo'
  | 'em-qualificacao'
  | 'qualificado'
  | 'sem-contato'
  | 'convertido'
  | 'perdido'

export type CustomerStatus = 'ativo' | 'onboarding' | 'expansao' | 'risco' | 'churn'

export type CompanySize = 'micro' | 'pequena' | 'media' | 'grande'

export type ActivityType = 'ligacao' | 'whatsapp' | 'email' | 'reuniao' | 'follow-up' | 'tarefa'

export type Temperature = 'frio' | 'morno' | 'quente'

export interface Contact {
  id: ID
  name: string
  role: string
  email: string
  whatsapp: string
  companyId: ID
  isPrimary: boolean
}

export interface Company {
  id: ID
  legalName: string
  tradeName: string
  cnpj: string
  segment: string
  size: CompanySize
  city: string
  state: string
  website: string
  employees: number
  createdAt: string
  contacts: Contact[]
  mrr: number
  contract: string | null
  ticket: number
  totalSold: number
  intelligence: ClientIntelligence | null
}

export interface ClientIntelligence {
  needs: string[]
  painPoints: string[]
  interest: string
  budgetMin: number
  budgetMax: number
  deadlineDays: number
  temperature: Temperature
  lastSyncedAt: string
  confidence: number
}

export interface Lead {
  id: ID
  name: string
  companyId: ID
  companyName: string
  role: string
  email: string
  whatsapp: string
  source: LeadSource
  status: LeadStatus
  potentialValue: number
  ownerId: ID
  createdAt: string
  lastInteractionAt: string
  notes: string
}

export interface Opportunity {
  id: ID
  title: string
  companyId: ID
  companyName: string
  contactId: ID
  contactName: string
  value: number
  stage: PipelineStageId
  probability: number
  priority: Priority
  source: LeadSource
  ownerId: ID
  createdAt: string
  expectedCloseAt: string
  nextActionAt: string | null
  nextActionLabel: string | null
  lastInteractionAt: string
  timeline: TimelineEvent[]
}

export interface TimelineEvent {
  id: ID
  type: ActivityType | 'estagio' | 'criacao'
  title: string
  description: string
  date: string
  authorId: ID
}

export interface Customer {
  id: ID
  companyId: ID
  companyName: string
  primaryContact: string
  plan: string
  mrr: number
  ltv: number
  status: CustomerStatus
  startedAt: string
  lastInteractionAt: string
  renewalAt: string
  ownerId: ID
  healthScore: number
}

export interface Activity {
  id: ID
  type: ActivityType
  title: string
  companyId: ID
  companyName: string
  opportunityId: ID | null
  ownerId: ID
  scheduledAt: string
  durationMinutes: number
  done: boolean
  notes: string
}

export interface MonthlyFinance {
  month: string
  label: string
  revenue: number
  cost: number
  goal: number
}

export interface CustomerFinance {
  customerId: ID
  companyName: string
  revenue: number
  cost: number
}

export interface Goal {
  id: ID
  label: string
  description: string
  current: number
  target: number
  unit: 'BRL' | 'unidade' | 'percentual'
  period: string
}

export interface TeamMember {
  id: ID
  name: string
  role: string
  email: string
  avatarColor: string
}

export interface NotificationItem {
  id: ID
  title: string
  description: string
  createdAt: string
  read: boolean
  tone: 'info' | 'positivo' | 'atencao' | 'critico'
  href: string | null
}

export type AgentStatus = 'ativo' | 'configuracao' | 'em-breve' | 'pausado'

export interface AIAgent {
  id: ID
  name: string
  description: string
  status: AgentStatus
  role: string
  metrics: { label: string; value: string }[]
  href: string | null
  capabilities: string[]
}

export interface WhatsAppMessage {
  id: ID
  author: 'cliente' | 'agente'
  text: string
  time: string
}

export interface ExtractedField {
  label: string
  value: string
  confidence: number
}

export interface WhatsAppConversation {
  id: ID
  contactName: string
  companyName: string
  phone: string
  lastMessageAt: string
  unread: number
  stage: string
  messages: WhatsAppMessage[]
  extracted: ExtractedField[]
  addedToCrm: boolean
}

export interface BriefingMetric {
  label: string
  value: string
  delta: number | null
}

export interface BriefingPriority {
  id: ID
  title: string
  company: string
  description: string
  value: number
  priority: Priority
  opportunityId: ID | null
}

export interface BriefingInsight {
  id: ID
  text: string
  tone: 'positivo' | 'atencao' | 'neutro'
}

export interface BriefingTask {
  id: ID
  label: string
  done: boolean
}

export interface MorningBriefing {
  date: string
  narrative: string
  metrics: BriefingMetric[]
  priorities: BriefingPriority[]
  insights: BriefingInsight[]
  tasks: BriefingTask[]
}

export interface PipelineStage {
  id: PipelineStageId
  label: string
  shortLabel: string
  probability: number
  kind: 'aberto' | 'ganho' | 'perdido'
}
