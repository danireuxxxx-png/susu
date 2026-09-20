/**
 * Sessão do usuário no navegador.
 *
 * Guarda apenas os tokens devolvidos pelo Supabase Auth e a organização
 * escolhida. Nenhuma credencial é persistida, e qualquer leitura falha
 * de forma segura (modo privado, storage bloqueado).
 */
export interface StoredSession {
  accessToken: string
  refreshToken: string
  expiresAt: number | null
  user: { id: string; email?: string; name?: string }
  organizationId: string
  role: string
}

const STORAGE_KEY = 'iacentrism-session'

let memorySession: StoredSession | null = null

export function readSession(): StoredSession | null {
  if (memorySession) return memorySession
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    memorySession = raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    memorySession = null
  }
  return memorySession
}

export function writeSession(session: StoredSession | null) {
  memorySession = session
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sem storage a sessão vale só enquanto a aba estiver aberta.
  }
}

export function clearSession() {
  writeSession(null)
}
