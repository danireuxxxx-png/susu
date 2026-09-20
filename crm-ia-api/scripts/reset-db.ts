/**
 * Reaplica todas as migrations em um banco existente.
 *
 * Uso em desenvolvimento. Em produção o caminho é `supabase db push`,
 * que aplica apenas o que ainda não rodou.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import { env } from '../src/env.js'

if (env.NODE_ENV === 'production') {
  throw new Error('reset não roda em produção')
}

const dir = fileURLToPath(new URL('../supabase/migrations', import.meta.url))
const files = (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort()

const sql = postgres(env.DATABASE_URL, { ssl: env.DATABASE_SSL ? 'require' : false, max: 1 })

console.log('limpando o schema public...')
await sql.unsafe('drop schema if exists public cascade; create schema public;')

for (const file of files) {
  process.stdout.write(`aplicando ${file}... `)
  await sql.unsafe(await readFile(join(dir, file), 'utf8'))
  console.log('ok')
}

await sql.end()
console.log('\nmigrations aplicadas.')
