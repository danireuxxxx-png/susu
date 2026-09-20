import {
  ACTIVITY_TYPE_BY_ID,
  AGENT_STATUS_BY_ID,
  CUSTOMER_STATUS_BY_ID,
  LEAD_SOURCE_BY_ID,
  LEAD_STATUS_BY_ID,
  PRIORITY_BY_ID,
  TEMPERATURE_BY_ID,
} from '@/constants/labels'
import type {
  ActivityType,
  AgentStatus,
  CustomerStatus,
  LeadSource,
  LeadStatus,
  Priority,
  Temperature,
} from '@/types'
import { Badge, type BadgeProps } from './badge'

type Props = Omit<BadgeProps, 'tone' | 'children'>

export function LeadStatusBadge({ status, ...props }: Props & { status: LeadStatus }) {
  const descriptor = LEAD_STATUS_BY_ID[status]
  return <Badge tone={descriptor.tone} dot {...props}>{descriptor.label}</Badge>
}

export function CustomerStatusBadge({ status, ...props }: Props & { status: CustomerStatus }) {
  const descriptor = CUSTOMER_STATUS_BY_ID[status]
  return <Badge tone={descriptor.tone} dot {...props}>{descriptor.label}</Badge>
}

export function PriorityBadge({ priority, ...props }: Props & { priority: Priority }) {
  const descriptor = PRIORITY_BY_ID[priority]
  return <Badge tone={descriptor.tone} dot {...props}>{descriptor.label}</Badge>
}

export function SourceBadge({ source, ...props }: Props & { source: LeadSource }) {
  return <Badge tone="neutro" {...props}>{LEAD_SOURCE_BY_ID[source].label}</Badge>
}

export function ActivityTypeBadge({ type, ...props }: Props & { type: ActivityType }) {
  const descriptor = ACTIVITY_TYPE_BY_ID[type]
  return <Badge tone={descriptor.tone} dot {...props}>{descriptor.label}</Badge>
}

export function TemperatureBadge({ temperature, ...props }: Props & { temperature: Temperature }) {
  const descriptor = TEMPERATURE_BY_ID[temperature]
  return <Badge tone={descriptor.tone} dot {...props}>{descriptor.label}</Badge>
}

export function AgentStatusBadge({ status, ...props }: Props & { status: AgentStatus }) {
  const descriptor = AGENT_STATUS_BY_ID[status]
  return <Badge tone={descriptor.tone} dot {...props}>{descriptor.label}</Badge>
}
