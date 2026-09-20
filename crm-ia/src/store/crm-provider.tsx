import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { crmService } from '@/services'
import type { Activity, Goal, Lead, Opportunity, PipelineStageId } from '@/types'
import { CrmContext, type CrmContextValue } from './crm-context'
import { crmReducer, initialCrmState } from './crm-reducer'

/**
 * Estado global do CRM.
 *
 * Toda mutacao segue o mesmo caminho: dispara a chamada de servico e aplica o
 * retorno no reducer. Como o servico hoje e mockado, as alteracoes vivem
 * apenas na sessao — trocar o transporte por uma API real nao muda esta
 * camada.
 */
export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(crmReducer, initialCrmState)

  const load = useCallback(() => {
    const controller = new AbortController()
    dispatch({ type: 'bootstrap/start' })
    crmService
      .bootstrap({ signal: controller.signal })
      .then((snapshot) => dispatch({ type: 'bootstrap/success', payload: snapshot }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        dispatch({
          type: 'bootstrap/error',
          payload: error instanceof Error ? error.message : 'Não foi possível carregar os dados.',
        })
      })
    return () => controller.abort()
  }, [])

  useEffect(() => load(), [load])

  const value = useMemo<CrmContextValue>(
    () => ({
      status: state.status,
      error: state.error,
      data: state.data,
      reload: () => {
        load()
      },
      saveLead: async (lead: Lead) => {
        const exists = state.data?.leads.some((item) => item.id === lead.id)
        const saved = exists ? await crmService.updateLead(lead) : await crmService.createLead(lead)
        dispatch({ type: 'lead/upsert', payload: saved })
      },
      removeLead: async (id: string) => {
        await crmService.deleteLead(id)
        dispatch({ type: 'lead/delete', payload: id })
      },
      saveOpportunity: async (opportunity: Opportunity) => {
        const exists = state.data?.opportunities.some((item) => item.id === opportunity.id)
        const saved = exists
          ? await crmService.updateOpportunity(opportunity)
          : await crmService.createOpportunity(opportunity)
        dispatch({ type: 'opportunity/upsert', payload: saved })
      },
      removeOpportunity: async (id: string) => {
        await crmService.deleteOpportunity(id)
        dispatch({ type: 'opportunity/delete', payload: id })
      },
      moveOpportunity: async (id: string, stage: PipelineStageId) => {
        // Otimista: o card se move na hora e a chamada confirma depois.
        dispatch({ type: 'opportunity/move', payload: { id, stage } })
        await crmService.moveOpportunity(id, stage)
      },
      saveActivity: async (activity: Activity) => {
        const exists = state.data?.activities.some((item) => item.id === activity.id)
        const saved = exists
          ? await crmService.updateActivity(activity)
          : await crmService.createActivity(activity)
        dispatch({ type: 'activity/upsert', payload: saved })
      },
      toggleActivity: (id: string) => dispatch({ type: 'activity/toggle', payload: id }),
      saveGoal: async (goal: Goal) => {
        const saved = await crmService.updateGoal(goal)
        dispatch({ type: 'goal/update', payload: saved })
      },
      readNotification: (id: string) => {
        dispatch({ type: 'notification/read', payload: id })
        void crmService.readNotification(id)
      },
      readAllNotifications: () => {
        dispatch({ type: 'notification/read-all' })
        void crmService.readAllNotifications()
      },
      toggleBriefingTask: (id: string) => dispatch({ type: 'briefing/toggle-task', payload: id }),
    }),
    [state, load],
  )

  return <CrmContext value={value}>{children}</CrmContext>
}
