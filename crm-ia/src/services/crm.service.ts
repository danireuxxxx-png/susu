import { database } from '@/mock/database'
import type {
  Activity,
  Company,
  Customer,
  Goal,
  Lead,
  NotificationItem,
  Opportunity,
  PipelineStageId,
  TeamMember,
} from '@/types'
import type { FinanceDataset } from '@/mock/finance'
import type { MorningBriefing } from '@/types'
import { isBackendEnabled, request, type RequestOptions } from './api-client'
import {
  bootstrapFromApi,
  deleteLeadOnApi,
  deleteOpportunityOnApi,
  moveOpportunityOnApi,
  apiContext,
  readAllNotificationsOnApi,
  readNotificationOnApi,
  saveActivityOnApi,
  saveGoalOnApi,
  saveLeadOnApi,
  saveOpportunityOnApi,
} from './backend.service'

export interface CrmSnapshot {
  companies: Company[]
  customers: Customer[]
  opportunities: Opportunity[]
  leads: Lead[]
  activities: Activity[]
  goals: Goal[]
  finance: FinanceDataset
  briefing: MorningBriefing
  notifications: NotificationItem[]
  team: TeamMember[]
  currentUser: TeamMember
}

/**
 * Contrato do CRM.
 *
 * Com VITE_API_URL definida, cada método chama a API real; sem ela, a
 * mesma assinatura resolve contra a base mockada. As telas não mudam.
 */
export const crmService = {
  /** GET /bootstrap — carga inicial do workspace. */
  bootstrap(options?: RequestOptions): Promise<CrmSnapshot> {
    if (isBackendEnabled) return bootstrapFromApi()

    return request<CrmSnapshot>('/bootstrap', () => ({
      companies: database.companies,
      customers: database.customers,
      opportunities: database.opportunities,
      leads: database.leads,
      activities: database.activities,
      goals: database.goals,
      finance: database.finance,
      briefing: database.briefing,
      notifications: database.notifications,
      team: database.team,
      currentUser: database.currentUser,
    }), { latency: 420, ...options })
  },

  /** POST /leads */
  createLead(lead: Lead): Promise<Lead> {
    if (isBackendEnabled) return saveLeadOnApi(lead, false)
    return request('/leads', () => lead, { latency: 200 })
  },

  /** PATCH /leads/:id */
  updateLead(lead: Lead): Promise<Lead> {
    if (isBackendEnabled) return saveLeadOnApi(lead, true)
    return request(`/leads/${lead.id}`, () => lead, { latency: 200 })
  },

  /** DELETE /leads/:id */
  async deleteLead(id: string): Promise<{ id: string }> {
    if (isBackendEnabled) {
      await deleteLeadOnApi(id)
      return { id }
    }
    return request(`/leads/${id}`, () => ({ id }), { latency: 180 })
  },

  /** POST /opportunities */
  createOpportunity(opportunity: Opportunity): Promise<Opportunity> {
    if (isBackendEnabled) {
      return saveOpportunityOnApi(opportunity, false, apiContext.stageIdByFrontend, apiContext.pipelineId)
    }
    return request('/opportunities', () => opportunity, { latency: 200 })
  },

  /** PATCH /opportunities/:id */
  updateOpportunity(opportunity: Opportunity): Promise<Opportunity> {
    if (isBackendEnabled) {
      return saveOpportunityOnApi(opportunity, true, apiContext.stageIdByFrontend, apiContext.pipelineId)
    }
    return request(`/opportunities/${opportunity.id}`, () => opportunity, { latency: 200 })
  },

  /** POST /opportunities/:id/stage — chamada dedicada do drag and drop. */
  async moveOpportunity(id: string, stage: PipelineStageId): Promise<{ id: string; stage: PipelineStageId }> {
    if (isBackendEnabled) {
      const stageId = apiContext.stageIdByFrontend.get(stage)
      if (stageId) await moveOpportunityOnApi(id, stageId)
      return { id, stage }
    }
    return request(`/opportunities/${id}/stage`, () => ({ id, stage }), { latency: 120 })
  },

  /** DELETE /opportunities/:id */
  async deleteOpportunity(id: string): Promise<{ id: string }> {
    if (isBackendEnabled) {
      await deleteOpportunityOnApi(id)
      return { id }
    }
    return request(`/opportunities/${id}`, () => ({ id }), { latency: 180 })
  },

  /** POST /activities */
  createActivity(activity: Activity): Promise<Activity> {
    if (isBackendEnabled) return saveActivityOnApi(activity, false)
    return request('/activities', () => activity, { latency: 200 })
  },

  /** PATCH /activities/:id */
  updateActivity(activity: Activity): Promise<Activity> {
    if (isBackendEnabled) return saveActivityOnApi(activity, true)
    return request(`/activities/${activity.id}`, () => activity, { latency: 160 })
  },

  /** PATCH /goals/:id */
  updateGoal(goal: Goal): Promise<Goal> {
    if (isBackendEnabled) return saveGoalOnApi(goal)
    return request(`/goals/${goal.id}`, () => goal, { latency: 200 })
  },

  /** POST /notifications/:id/read */
  async readNotification(id: string): Promise<void> {
    if (isBackendEnabled) await readNotificationOnApi(id)
  },

  /** POST /notifications/read-all */
  async readAllNotifications(): Promise<void> {
    if (isBackendEnabled) await readAllNotificationsOnApi()
  },
}
