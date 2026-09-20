import postgres from 'postgres'
import { env } from '../env.js'

/**
 * Acesso a dados.
 *
 * O pool conecta como um papel privilegiado, mas NENHUMA query de tenant
 * roda com esse privilégio: `withUser` abre uma transação, injeta as
 * claims do JWT e troca para o papel `authenticated` — exatamente o que
 * o PostgREST faz. A partir daí o RLS do Postgres é quem decide o que a
 * query enxerga, mesmo que a aplicação tenha um bug.
 */
export const sql = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_MAX,
  ssl: env.DATABASE_SSL ? 'require' : false,
  prepare: false,
  onnotice: () => {},
  transform: { undefined: null },
})

export type Sql = postgres.Sql | postgres.TransactionSql

export interface RlsContext {
  userId: string
  role?: string
}

/** Executa o bloco no contexto do usuário autenticado, com RLS ativo. */
export async function withUser<T>(context: RlsContext, run: (tx: postgres.TransactionSql) => Promise<T>) {
  const claims = JSON.stringify({ sub: context.userId, role: context.role ?? 'authenticated' })

  return sql.begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${claims}, true)`
    await tx`set local role authenticated`
    return run(tx)
  }) as Promise<T>
}

/**
 * Executa sem contexto de usuário (papel privilegiado do pool).
 * Reservado a rotinas administrativas — jamais para dados de tenant
 * vindos de uma requisição.
 */
export async function withServiceRole<T>(run: (tx: postgres.TransactionSql) => Promise<T>) {
  return sql.begin(run) as Promise<T>
}

export async function closeDatabase() {
  await sql.end({ timeout: 5 })
}
