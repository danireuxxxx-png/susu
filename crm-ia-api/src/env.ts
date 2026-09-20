import { config } from 'dotenv'
import { z } from 'zod'

config()

/**
 * Configuração validada na inicialização: o processo não sobe com
 * variável faltando ou malformada. Nenhum segredo tem valor padrão.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  /** Conexão direta com o Postgres do Supabase (pooler na porta 6543). */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_SSL: z
    .enum(['require', 'disable'])
    .default('require')
    .transform((value) => value === 'require'),

  SUPABASE_URL: z.string().url().optional(),
  /** Chave pública: usada no login e no refresh em nome do usuário. */
  SUPABASE_ANON_KEY: z.string().optional(),
  /** Chave de serviço: só para administração (criar usuário, convite). NUNCA vai ao cliente. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  /** Segredo do JWT: permite validar o token localmente, sem ida à rede. */
  SUPABASE_JWT_SECRET: z.string().optional(),

  /** Origens liberadas no CORS, separadas por vírgula. */
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `  · ${issue.path.join('.')}: ${issue.message}`)
  throw new Error(`Configuração inválida:\n${issues.join('\n')}`)
}

export const env = parsed.data

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const isProduction = env.NODE_ENV === 'production'
