import type { Activity, Goal, Lead, Opportunity, PipelineStageId } from '@/types'
import type { CrmSnapshot } from '@/services'

export type CrmStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface CrmState {
  status: CrmStatus
  error: string | null
  data: CrmSnapshot | null
}

export type CrmAction =
  | { type: 'bootstrap/start' }
  | { type: 'bootstrap/success'; payload: CrmSnapshot }
  | { type: 'bootstrap/error'; payload: string }
  | { type: 'lead/upsert'; payload: Lead }
  | { type: 'lead/delete'; payload: string }
  | { type: 'opportunity/upsert'; payload: Opportunity }
  | { type: 'opportunity/delete'; payload: string }
  | { type: 'opportunity/move'; payload: { id: string; stage: PipelineStageId } }
  | { type: 'activity/upsert'; payload: Activity }
  | { type: 'activity/toggle'; payload: string }
  | { type: 'goal/update'; payload: Goal }
  | { type: 'notification/read'; payload: string }
  | { type: 'notification/read-all' }
  | { type: 'briefing/toggle-task'; payload: string }

export const initialCrmState: CrmState = { status: 'idle', error: null, data: null }

function upsert<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex((current) => current.id === item.id)
  if (index === -1) return [item, ...items]
  const next = [...items]
  next[index] = item
  return next
}

function withData(state: CrmState, updater: (data: CrmSnapshot) => CrmSnapshot): CrmState {
  if (!state.data) return state
  return { ...state, data: updater(state.data) }
}

export function crmReducer(state: CrmState, action: CrmAction): CrmState {
  switch (action.type) {
    case 'bootstrap/start':
      return { ...state, status: 'loading', error: null }

    case 'bootstrap/success':
      return { status: 'ready', error: null, data: action.payload }

    case 'bootstrap/error':
      return { ...state, status: 'error', error: action.payload }

    case 'lead/upsert':
      return withData(state, (data) => ({ ...data, leads: upsert(data.leads, action.payload) }))

    case 'lead/delete':
      return withData(state, (data) => ({
        ...data,
        leads: data.leads.filter((lead) => lead.id !== action.payload),
      }))

    case 'opportunity/upsert':
      return withData(state, (data) => ({
        ...data,
        opportunities: upsert(data.opportunities, action.payload),
      }))

    case 'opportunity/delete':
      return withData(state, (data) => ({
        ...data,
        opportunities: data.opportunities.filter((item) => item.id !== action.payload),
      }))

    case 'opportunity/move':
      return withData(state, (data) => ({
        ...data,
        opportunities: data.opportunities.map((item) =>
          item.id === action.payload.id
            ? { ...item, stage: action.payload.stage, lastInteractionAt: new Date().toISOString() }
            : item,
        ),
      }))

    case 'activity/upsert':
      return withData(state, (data) => ({
        ...data,
        activities: upsert(data.activities, action.payload).sort((a, b) =>
          a.scheduledAt.localeCompare(b.scheduledAt),
        ),
      }))

    case 'activity/toggle':
      return withData(state, (data) => ({
        ...data,
        activities: data.activities.map((item) =>
          item.id === action.payload ? { ...item, done: !item.done } : item,
        ),
      }))

    case 'goal/update':
      return withData(state, (data) => ({
        ...data,
        goals: data.goals.map((goal) => (goal.id === action.payload.id ? action.payload : goal)),
      }))

    case 'notification/read':
      return withData(state, (data) => ({
        ...data,
        notifications: data.notifications.map((item) =>
          item.id === action.payload ? { ...item, read: true } : item,
        ),
      }))

    case 'notification/read-all':
      return withData(state, (data) => ({
        ...data,
        notifications: data.notifications.map((item) => ({ ...item, read: true })),
      }))

    case 'briefing/toggle-task':
      return withData(state, (data) => ({
        ...data,
        briefing: {
          ...data.briefing,
          tasks: data.briefing.tasks.map((task) =>
            task.id === action.payload ? { ...task, done: !task.done } : task,
          ),
        },
      }))

    default:
      return state
  }
}
