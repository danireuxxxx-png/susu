import type { BillingPeriod, CostCategory, CostType, ProjectStatus } from '@/types'
import type { Tone } from './labels'

interface Option<T extends string> {
  id: T
  label: string
  tone?: Tone
}

/** Rótulos em português para o vocabulário de custos do backend. */
export const COST_CATEGORIES: Option<CostCategory>[] = [
  { id: 'AI_API', label: 'API de IA' },
  { id: 'WHATSAPP_API', label: 'API de WhatsApp' },
  { id: 'THIRD_PARTY_API', label: 'API de terceiros' },
  { id: 'VPS', label: 'VPS' },
  { id: 'HOSTING', label: 'Hospedagem' },
  { id: 'INFRASTRUCTURE', label: 'Infraestrutura' },
  { id: 'DATABASE', label: 'Banco de dados' },
  { id: 'STORAGE', label: 'Armazenamento' },
  { id: 'DOMAIN', label: 'Domínio e CDN' },
  { id: 'EMAIL', label: 'E-mail' },
  { id: 'SMS', label: 'SMS' },
  { id: 'AUTOMATION', label: 'Automação' },
  { id: 'SOFTWARE', label: 'Software' },
  { id: 'SUPPORT', label: 'Suporte' },
  { id: 'HUMAN_RESOURCE', label: 'Equipe' },
  { id: 'MARKETING', label: 'Marketing' },
  { id: 'OTHER', label: 'Outros' },
]

export const COST_CATEGORY_LABEL = Object.fromEntries(
  COST_CATEGORIES.map((item) => [item.id, item.label]),
) as Record<CostCategory, string>

export const COST_TYPES: Option<CostType>[] = [
  { id: 'FIXED', label: 'Fixo', tone: 'neutro' },
  { id: 'VARIABLE', label: 'Variável', tone: 'atencao' },
  { id: 'USAGE_BASED', label: 'Por consumo', tone: 'destaque' },
]

export const COST_TYPE_BY_ID = Object.fromEntries(COST_TYPES.map((item) => [item.id, item])) as Record<
  CostType,
  Option<CostType>
>

export const BILLING_PERIODS: Option<BillingPeriod>[] = [
  { id: 'MONTHLY', label: 'Mensal' },
  { id: 'YEARLY', label: 'Anual' },
  { id: 'QUARTERLY', label: 'Trimestral' },
  { id: 'SEMIANNUAL', label: 'Semestral' },
  { id: 'WEEKLY', label: 'Semanal' },
  { id: 'DAILY', label: 'Diário' },
  { id: 'ONE_TIME', label: 'Pontual (não recorrente)' },
]

export const BILLING_PERIOD_LABEL = Object.fromEntries(
  BILLING_PERIODS.map((item) => [item.id, item.label]),
) as Record<BillingPeriod, string>

export const PROJECT_STATUSES: Option<ProjectStatus>[] = [
  { id: 'ativo', label: 'Ativo', tone: 'positivo' },
  { id: 'onboarding', label: 'Em implantação', tone: 'info' },
  { id: 'proposto', label: 'Proposto', tone: 'neutro' },
  { id: 'pausado', label: 'Pausado', tone: 'atencao' },
  { id: 'concluido', label: 'Concluído', tone: 'neutro' },
  { id: 'cancelado', label: 'Cancelado', tone: 'critico' },
]

export const PROJECT_STATUS_BY_ID = Object.fromEntries(
  PROJECT_STATUSES.map((item) => [item.id, item]),
) as Record<ProjectStatus, Option<ProjectStatus>>

/** Margem abaixo disso liga o alerta na tela de rentabilidade. */
export const MARGIN_ALERT_THRESHOLD = 60
