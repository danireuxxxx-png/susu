import { API_BASE_URL, ApiError } from './api-client'
import { clearSession, readSession, writeSession } from './session'

/**
 * Cliente HTTP da API.
 *
 * Anexa o token e a organização a cada chamada, renova a sessão uma vez
 * quando o token expira e normaliza o erro que a API devolve.
 */
interface ApiEnvelope<T> {
  data: T
  meta?: { page: number; limit: number; total: number; totalPages: number }
}

interface RequestInitWithBody extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Ignora a sessão (usado no login). */
  anonymous?: boolean
}

let refreshing: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  const session = readSession()
  if (!session?.refreshToken) return false

  // Uma renovação por vez: várias chamadas em paralelo esperam a mesma.
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })
      if (!response.ok) return false

      const payload = (await response.json()) as ApiEnvelope<{
        accessToken: string
        refreshToken: string
        expiresAt: number | null
      }>

      writeSession({ ...session, ...payload.data })
      return true
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()

  return refreshing
}

async function send<T>(path: string, init: RequestInitWithBody = {}, retrying = false): Promise<ApiEnvelope<T>> {
  const session = init.anonymous ? null : readSession()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }

  if (session) {
    headers.Authorization = `Bearer ${session.accessToken}`
    headers['x-organization-id'] = session.organizationId
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

  if (response.status === 401 && !init.anonymous && !retrying) {
    if (await refreshSession()) return send<T>(path, init, true)
    clearSession()
    throw new ApiError('Sessão expirada. Faça login novamente.', 401)
  }

  if (response.status === 204) return { data: undefined as T }

  const payload = (await response.json().catch(() => null)) as
    | (ApiEnvelope<T> & { error?: { code: string; message: string } })
    | null

  if (!response.ok) {
    throw new ApiError(payload?.error?.message ?? 'Falha na requisição', response.status)
  }

  return payload as ApiEnvelope<T>
}

export const api = {
  get: <T>(path: string) => send<T>(path).then((payload) => payload.data),
  /** Listagens: devolve dados e metadados de paginação. */
  list: <T>(path: string) => send<T[]>(path),
  post: <T>(path: string, body?: unknown, options: { anonymous?: boolean } = {}) =>
    send<T>(path, { method: 'POST', body, anonymous: options.anonymous }).then((payload) => payload.data),
  patch: <T>(path: string, body: unknown) =>
    send<T>(path, { method: 'PATCH', body }).then((payload) => payload.data),
  delete: <T>(path: string) => send<T>(path, { method: 'DELETE' }).then((payload) => payload.data),
}

/**
 * Busca todas as páginas de uma listagem.
 *
 * O limite por página é o máximo que a API aceita (100); páginas a mais
 * são pedidas em sequência até acabar.
 */
export async function fetchAll<T>(path: string, maxPages = 20, limit = 100): Promise<T[]> {
  const separator = path.includes('?') ? '&' : '?'
  const rows: T[] = []

  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await api.list<T>(`${path}${separator}page=${page}&limit=${limit}`)
    rows.push(...payload.data)
    if (!payload.meta || page >= payload.meta.totalPages) break
  }

  return rows
}
