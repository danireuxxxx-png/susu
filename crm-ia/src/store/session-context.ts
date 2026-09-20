import { createContext } from 'react'
import type { StoredSession } from '@/services/session'

export interface SessionContextValue {
  session: StoredSession | null
  /** Sem backend configurado o app roda em modo demonstração. */
  demoMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)
