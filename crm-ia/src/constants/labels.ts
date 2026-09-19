import type {
  ActivityType,
  AgentStatus,
  CompanySize,
  CustomerStatus,
  LeadSource,
  LeadStatus,
  Priority,
  Temperature,
} from '@/types'

export type Tone = 'neutro' | 'info' | 'positivo' | 'atencao' | 'critico' | 'destaque'

interface Descriptor<T extends string> {
  id: T
  label: string
  tone: Tone
}

function index<T extends string>(items: Descriptor<T>[]) {
  return Object.fromEntries(items.map((item) => [item.id, item])) as Record<T, Descriptor<T>>
}

export const LEAD_SOURCES: Descriptor<LeadSource>[] = [
  { id: 'whatsapp', label: 'WhatsApp', tone: 'positivo' },
  { id: 'instagram', label: 'Instagram', tone: 'destaque' },
  { id: 'indicacao', label: 'Indicação', tone: 'info' },
  { id: 'site', label: 'Site', tone: 'neutro' },
  { id: 'outbound', label: 'Outbound', tone: 'atencao' },
  { id: 'outros', label: 'Outros', tone: 'neutro' },
]
export const LEAD_SOURCE_BY_ID = index(LEAD_SOURCES)

export const LEAD_STATUSES: Descriptor<LeadStatus>[] = [
  { id: 'novo', label: 'Novo', tone: 'info' },
  { id: 'em-qualificacao', label: 'Em qualificação', tone: 'destaque' },
  { id: 'qualificado', label: 'Qualificado', tone: 'positivo' },
  { id: 'sem-contato', label: 'Sem contato', tone: 'atencao' },
  { id: 'convertido', label: 'Convertido', tone: 'positivo' },
  { id: 'perdido', label: 'Perdido', tone: 'critico' },
]
export const LEAD_STATUS_BY_ID = index(LEAD_STATUSES)

export const CUSTOMER_STATUSES: Descriptor<CustomerStatus>[] = [
  { id: 'ativo', label: 'Ativo', tone: 'positivo' },
  { id: 'onboarding', label: 'Em onboarding', tone: 'info' },
  { id: 'expansao', label: 'Expansão', tone: 'destaque' },
  { id: 'risco', label: 'Risco', tone: 'atencao' },
  { id: 'churn', label: 'Churn', tone: 'critico' },
]
export const CUSTOMER_STATUS_BY_ID = index(CUSTOMER_STATUSES)

export const PRIORITIES: Descriptor<Priority>[] = [
  { id: 'baixa', label: 'Baixa', tone: 'neutro' },
  { id: 'media', label: 'Média', tone: 'info' },
  { id: 'alta', label: 'Alta', tone: 'critico' },
]
export const PRIORITY_BY_ID = index(PRIORITIES)

export const ACTIVITY_TYPES: Descriptor<ActivityType>[] = [
  { id: 'ligacao', label: 'Ligação', tone: 'info' },
  { id: 'whatsapp', label: 'WhatsApp', tone: 'positivo' },
  { id: 'email', label: 'Email', tone: 'neutro' },
  { id: 'reuniao', label: 'Reunião', tone: 'destaque' },
  { id: 'follow-up', label: 'Follow-up', tone: 'atencao' },
  { id: 'tarefa', label: 'Tarefa', tone: 'neutro' },
]
export const ACTIVITY_TYPE_BY_ID = index(ACTIVITY_TYPES)

export const COMPANY_SIZES: Descriptor<CompanySize>[] = [
  { id: 'micro', label: 'Microempresa', tone: 'neutro' },
  { id: 'pequena', label: 'Pequeno porte', tone: 'neutro' },
  { id: 'media', label: 'Médio porte', tone: 'info' },
  { id: 'grande', label: 'Grande porte', tone: 'destaque' },
]
export const COMPANY_SIZE_BY_ID = index(COMPANY_SIZES)

export const TEMPERATURES: Descriptor<Temperature>[] = [
  { id: 'frio', label: 'Frio', tone: 'info' },
  { id: 'morno', label: 'Morno', tone: 'atencao' },
  { id: 'quente', label: 'Quente', tone: 'critico' },
]
export const TEMPERATURE_BY_ID = index(TEMPERATURES)

export const AGENT_STATUSES: Descriptor<AgentStatus>[] = [
  { id: 'ativo', label: 'Ativo', tone: 'positivo' },
  { id: 'configuracao', label: 'Configuração', tone: 'atencao' },
  { id: 'em-breve', label: 'Em breve', tone: 'neutro' },
  { id: 'pausado', label: 'Pausado', tone: 'critico' },
]
export const AGENT_STATUS_BY_ID = index(AGENT_STATUSES)
