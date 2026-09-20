/**
 * Seed contra um Supabase real.
 *
 * Cria os usuários de desenvolvimento pela Admin API (a senha nunca passa
 * por SQL) e aplica supabase/seed.sql no banco. Só roda fora de produção.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import { env } from '../src/env.js'
import { getSupabaseAdmin } from '../src/lib/supabase.js'

if (env.NODE_ENV === 'production') {
  throw new Error('o seed de desenvolvimento não roda em produção')
}

const DEV_PASSWORD = process.env.SEED_PASSWORD ?? 'dev-password-123'

const USERS = [
  { email: 'owner@iacentrism.ai', name: 'Danilo Reux' },
  { email: 'admin@iacentrism.ai', name: 'Marina Duarte' },
  { email: 'manager@iacentrism.ai', name: 'Rafael Nunes' },
  { email: 'sales@iacentrism.ai', name: 'Bianca Mota' },
  { email: 'finance@iacentrism.ai', name: 'Caio Ferraz' },
  { email: 'outsider@outra.ai', name: 'Pessoa de Fora' },
]

const admin = getSupabaseAdmin()

for (const user of USERS) {
  const { error } = await admin.auth.admin.createUser({
    email: user.email,
    password: DEV_PASSWORD,
    email_confirm: true,
    user_metadata: { name: user.name },
  })

  if (error && !/already/i.test(error.message)) {
    throw new Error(`falha ao criar ${user.email}: ${error.message}`)
  }
  console.log(`usuário pronto: ${user.email}`)
}

const sql = postgres(env.DATABASE_URL, { ssl: env.DATABASE_SSL ? 'require' : false, max: 1 })
const seedPath = fileURLToPath(new URL('../supabase/seed.sql', import.meta.url))

await sql.unsafe(await readFile(seedPath, 'utf8'))
await sql.end()

console.log(`\nseed aplicado. Senha de desenvolvimento: ${DEV_PASSWORD}`)
