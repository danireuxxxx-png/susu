import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { isBackendEnabled } from '@/services/api-client'
import { authService } from '@/services/auth.service'
import { readSession, type StoredSession } from '@/services/session'
import { SessionContext } from './session-context'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() =>
    isBackendEnabled ? readSession() : null,
  )

  const signIn = useCallback(async (email: string, password: string) => {
    setSession(await authService.signIn(email, password))
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, demoMode: !isBackendEnabled, signIn, signOut }),
    [session, signIn, signOut],
  )

  return <SessionContext value={value}>{children}</SessionContext>
}
