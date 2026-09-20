import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../env.js'
import { getSupabaseAuth } from './supabase.js'
import { unauthorized } from './errors.js'

export interface TokenClaims {
  sub: string
  email?: string
  role?: string
  exp?: number
  aud?: string | string[]
}

function base64UrlDecode(value: string) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

/**
 * Verificação local do JWT do Supabase (HS256).
 *
 * Evita uma chamada de rede por requisição. A assinatura é comparada em
 * tempo constante e a expiração é checada — token sem `exp` é recusado.
 */
export function verifyJwtLocally(token: string, secret: string): TokenClaims {
  const parts = token.split('.')
  if (parts.length !== 3) throw unauthorized('Token malformado')

  const [header, payload, signature] = parts as [string, string, string]

  const algorithm = JSON.parse(base64UrlDecode(header).toString('utf8')) as { alg?: string }
  if (algorithm.alg !== 'HS256') {
    throw unauthorized('Algoritmo de token não suportado')
  }

  const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest()
  const received = base64UrlDecode(signature)

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw unauthorized('Assinatura do token inválida')
  }

  const claims = JSON.parse(base64UrlDecode(payload).toString('utf8')) as TokenClaims

  if (!claims.sub) throw unauthorized('Token sem identificação de usuário')
  if (!claims.exp || claims.exp * 1000 <= Date.now()) throw unauthorized('Sessão expirada')

  return claims
}

/** Algoritmo declarado no token, sem confiar no conteúdo ainda. */
function readAlgorithm(token: string): string | undefined {
  const [header] = token.split('.')
  if (!header) return undefined
  try {
    return (JSON.parse(base64UrlDecode(header).toString('utf8')) as { alg?: string }).alg
  } catch {
    return undefined
  }
}

/**
 * Valida o token: localmente quando dá, senão pelo Supabase.
 *
 * Projetos novos do Supabase assinam com chave assimétrica (ES256/RS256),
 * onde não existe segredo compartilhado para conferir. Em vez de recusar
 * todo mundo quando SUPABASE_JWT_SECRET estiver configurado por engano, a
 * validação cai para a rede — mais lenta, mas correta.
 */
export async function resolveToken(token: string): Promise<TokenClaims> {
  if (env.SUPABASE_JWT_SECRET && readAlgorithm(token) === 'HS256') {
    return verifyJwtLocally(token, env.SUPABASE_JWT_SECRET)
  }

  const { data, error } = await getSupabaseAuth().auth.getUser(token)
  if (error || !data.user) throw unauthorized('Sessão inválida')

  return { sub: data.user.id, email: data.user.email ?? undefined, role: 'authenticated' }
}
