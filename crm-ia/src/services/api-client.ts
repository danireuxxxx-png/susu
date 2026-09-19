/**
 * Transporte da camada de dados.
 *
 * Hoje toda chamada resolve contra o snapshot em memoria de `src/mock`. O dia
 * em que existir backend, apenas este arquivo muda: `request` passa a fazer
 * `fetch(`${API_BASE_URL}${path}`)` (ou uma query GraphQL) e as assinaturas dos
 * servicos continuam identicas — nenhuma tela precisa ser tocada.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

/** Latencia simulada: e o que faz os skeletons existirem de verdade. */
const DEFAULT_LATENCY = 260

export interface RequestOptions {
  latency?: number
  signal?: AbortSignal
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function request<T>(
  _path: string,
  resolver: () => T,
  options: RequestOptions = {},
): Promise<T> {
  const latency = options.latency ?? DEFAULT_LATENCY

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        resolve(structuredClone(resolver()))
      } catch (error) {
        reject(new ApiError(error instanceof Error ? error.message : 'Falha na requisição'))
      }
    }, latency)

    options.signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new ApiError('Requisição cancelada', 499))
    })
  })
}
