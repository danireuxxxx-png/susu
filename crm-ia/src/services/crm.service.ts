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
import { request, type RequestOptions } from './api-client'

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
 * Contrato do CRM. As mutacoes devolvem a entidade ja "persistida" — a store
 * aplica o resultado no estado, exatamente como faria com uma API real.
 */
export const crmService = {
  /** GET /bootstrap — carga inicial do workspace. */
  bootstrap(options?: RequestOptions): Promise<CrmSnapshot> {
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
    return request('/leads', () => lead, { latency: 200 })
  },

  /** PATCH /leads/:id */
  updateLead(lead: Lead): Promise<Lead> {
    return request(`/leads/${lead.id}`, () => lead, { latency: 200 })
  },

  /** DELETE /leads/:id */
  deleteLead(id: string): Promise<{ id: string }> {
    return request(`/leads/${id}`, () => ({ id }), { latency: 180 })
  },

  /** POST /opportunities */
  createOpportunity(opportunity: Opportunity): Promise<Opportunity> {
    return request('/opportunities', () => opportunity, { latency: 200 })
  },

  /** PATCH /opportunities/:id */
  updateOpportunity(opportunity: Opportunity): Promise<Opportunity> {
    return request(`/opportunities/${opportunity.id}`, () => opportunity, { latency: 200 })
  },

  /** PATCH /opportunities/:id/stage — chamada dedicada do drag and drop. */
  moveOpportunity(id: string, stage: PipelineStageId): Promise<{ id: string; stage: PipelineStageId }> {
    return request(`/opportunities/${id}/stage`, () => ({ id, stage }), { latency: 120 })
  },

  /** DELETE /opportunities/:id */
  deleteOpportunity(id: string): Promise<{ id: string }> {
    return request(`/opportunities/${id}`, () => ({ id }), { latency: 180 })
  },

  /** POST /activities */
  createActivity(activity: Activity): Promise<Activity> {
    return request('/activities', () => activity, { latency: 200 })
  },

  /** PATCH /activities/:id */
  updateActivity(activity: Activity): Promise<Activity> {
    return request(`/activities/${activity.id}`, () => activity, { latency: 160 })
  },

  /** PATCH /goals/:id */
  updateGoal(goal: Goal): Promise<Goal> {
    return request(`/goals/${goal.id}`, () => goal, { latency: 200 })
  },
}
