import { useContext } from 'react'
import { CrmContext } from '@/store/crm-context'

export function useCrm() {
  const context = useContext(CrmContext)
  if (!context) throw new Error('useCrm precisa estar dentro de <CrmProvider>.')
  return context
}

/**
 * Atalho para telas que so renderizam com dados prontos. O AppShell segura o
 * loading, entao aqui o snapshot ja existe.
 */
export function useCrmData() {
  const { data } = useCrm()
  if (!data) throw new Error('Dados do CRM ainda não carregados.')
  return data
}
