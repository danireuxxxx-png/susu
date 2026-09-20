/**
 * Aplicador de migrations.
 *
 * Roda as migrations pendentes em ordem, cada uma em sua transação, e
 * registra o que já foi aplicado em migrations.schema_migrations. Rodar
 * duas vezes não repete nada — é seguro em produção e não depende do
 * Supabase CLI.
 *
 *   npm run migrate              aplica o que falta
 *   npm run migrate -- --status  só lista o estado
 *
 * Use a conexão DIRETA do Supabase (porta 5432), não o pooler: DDL em
 * transação não combina com pool em modo transaction.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import { env } from '../src/env.js'

const MIGRATIONS_DIR = fileURLToPath(new URL('../supabase/migrations', import.meta.url))
const statusOnly = process.argv.includes('--status')

const sql = postgres(env.DATABASE_URL, {
  ssl: env.DATABASE_SSL ? 'require' : false,
  max: 1,
  // DDL com muitos statements: sem timeout curto.
  idle_timeout: 0,
  connect_timeout: 30,
})

// O controle das migrations mora em um schema próprio, fora de public:
// não é dado de aplicação, não deve aparecer na API do Supabase e não
// entra na conferência de RLS das tabelas de negócio.
await sql`create schema if not exists migrations`
await sql`revoke all on schema migrations from anon, authenticated`
await sql`
  create table if not exists migrations.schema_migrations (
    version    text primary key,
    checksum   text not null,
    applied_at timestamptz not null default now()
  )
`

// Instalações anteriores guardavam o registro em public: move e limpa.
await sql`
  do $$
  begin
    if to_regclass('public.schema_migrations') is not null then
      insert into migrations.schema_migrations (version, checksum, applied_at)
      select version, checksum, applied_at from public.schema_migrations
      on conflict (version) do nothing;
      drop table public.schema_migrations;
    end if;
  end;
  $$
`

const applied = await sql<{ version: string; checksum: string }[]>`
  select version, checksum from migrations.schema_migrations
`
const appliedByVersion = new Map(applied.map((row) => [row.version, row.checksum]))

const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort()
const pending: { version: string; sqlText: string; checksum: string }[] = []

for (const file of files) {
  const version = file.replace(/\.sql$/, '')
  const sqlText = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
  const checksum = createHash('sha256').update(sqlText).digest('hex').slice(0, 16)
  const previous = appliedByVersion.get(version)

  if (previous === undefined) {
    pending.push({ version, sqlText, checksum })
    continue
  }

  // Migration já aplicada que mudou de conteúdo: alerta, não reaplica.
  if (previous !== checksum) {
    console.warn(`⚠  ${version} foi alterada depois de aplicada (checksum ${previous} → ${checksum}).`)
    console.warn('   Crie uma migration nova em vez de editar uma que já rodou.')
  }
}

console.log(`${files.length} migrations no repositório · ${applied.length} aplicadas · ${pending.length} pendentes`)

if (statusOnly || pending.length === 0) {
  if (pending.length) {
    console.log('\nPendentes:')
    for (const item of pending) console.log(`  · ${item.version}`)
  } else {
    console.log('Banco em dia.')
  }
  await sql.end()
  process.exit(0)
}

for (const item of pending) {
  process.stdout.write(`aplicando ${item.version}... `)
  try {
    await sql.begin(async (tx) => {
      await tx.unsafe(item.sqlText)
      await tx`
        insert into migrations.schema_migrations (version, checksum)
        values (${item.version}, ${item.checksum})
      `
    })
    console.log('ok')
  } catch (error) {
    console.log('falhou')
    console.error(`\n${(error as Error).message}`)
    console.error('\nNada foi aplicado desta migration: a transação foi revertida.')
    await sql.end()
    process.exit(1)
  }
}

await sql.end()
console.log(`\n${pending.length} migration(s) aplicada(s).`)
