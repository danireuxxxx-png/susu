import { createContext } from 'react'
import type { Activity, Goal, Lead, Opportunity, PipelineStageId } from '@/types'
import type { CrmSnapshot } from '@/services'
import type { CrmStatus } from './crm-reducer'

export interface CrmContextValue {
  status: CrmStatus
  error: string | null
  data: CrmSnapshot | null
  reload: () => void
  saveLead: (lead: Lead) => Promise<void>
  removeLead: (id: string) => Promise<void>
  saveOpportunity: (opportunity: Opportunity) => Promise<void>
  removeOpportunity: (id: string) => Promise<void>
  moveOpportunity: (id: string, stage: PipelineStageId) => Promise<void>
  saveActivity: (activity: Activity) => Promise<void>
  toggleActivity: (id: string) => void
  saveGoal: (goal: Goal) => Promise<void>
  readNotification: (id: string) => void
  readAllNotifications: () => void
  toggleBriefingTask: (id: string) => void
}

export const CrmContext = createContext<CrmContextValue | null>(null)
