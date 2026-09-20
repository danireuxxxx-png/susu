import { api } from './http'
import { clearSession, readSession, writeSession, type StoredSession } from './session'

interface LoginResponse {
  session: { accessToken: string; refreshToken: string; expiresAt: number | null }
  user: { id: string; email: string }
  memberships: { organization_id: string; role: string; organization_name: string }[]
}

/**
 * Autenticação do app.
 *
 * As credenciais vão direto para a API, que as repassa ao Supabase Auth.
 * O navegador guarda apenas os tokens — nunca a senha.
 */
export const authService = {
  async signIn(email: string, password: string): Promise<StoredSession> {
    const data = await api.post<LoginResponse>('/auth/login', { email, password }, { anonymous: true })

    const membership = data.memberships[0]
    if (!membership) {
      throw new Error('Este usuário ainda não pertence a nenhuma organização.')
    }

    const session: StoredSession = {
      accessToken: data.session.accessToken,
      refreshToken: data.session.refreshToken,
      expiresAt: data.session.expiresAt,
      user: { id: data.user.id, email: data.user.email },
      organizationId: membership.organization_id,
      role: membership.role,
    }

    writeSession(session)
    return session
  },

  async signOut() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Mesmo se a API não responder, a sessão local vai embora.
    }
    clearSession()
  },

  async recoverPassword(email: string) {
    await api.post('/auth/password-recovery', { email }, { anonymous: true })
  },

  current: readSession,
}
