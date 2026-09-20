import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../env.js'
import { AppError } from './errors.js'

/**
 * Clientes do Supabase.
 *
 * O CRM usa o Supabase para o que ele faz melhor — identidade e arquivos —
 * e fala SQL direto com o Postgres para o resto (transações, agregações
 * financeiras, zero N+1). O RLS continua valendo nos dois caminhos.
 */
let anonClient: SupabaseClient | null = null
let adminClient: SupabaseClient | null = null

export function getSupabaseAuth(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new AppError('Supabase Auth não configurado', 503, 'AUTH_UNAVAILABLE')
  }
  anonClient ??= createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return anonClient
}

/**
 * Cliente com service role: ignora RLS por definição.
 * Só para administração (criar usuário, convite, storage interno) e
 * jamais alimentado por parâmetro vindo do cliente sem checagem.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError('Supabase Admin não configurado', 503, 'ADMIN_UNAVAILABLE')
  }
  adminClient ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return adminClient
}

export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY)
