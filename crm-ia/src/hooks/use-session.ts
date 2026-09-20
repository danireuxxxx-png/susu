import { useContext } from 'react'
import { SessionContext } from '@/store/session-context'

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession precisa estar dentro de <SessionProvider>.')
  return context
}
