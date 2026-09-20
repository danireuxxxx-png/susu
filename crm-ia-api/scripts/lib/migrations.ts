/**
 * Motor das migrations, compartilhado pelo `migrate` e pelo `setup`.
 *
 * Cada migration roda em sua própria transação e fica registrada em
 * migrations.schema_migrations — um schema à parte, porque controle de
 * versão não é dado de aplicação: não aparece na API do Supabase e não
 * entra na conferência de RLS das tabelas de negócio.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Sql } from 'postgres'

const MIGRATIONS_DIR = fileURLToPath(new URL('../../supabase/migrations', import.meta.url))

export interface Migration {
  version: string
  sqlText: string
  checksum: string
}

export interface MigrationState {
  total: number
  applied: number
  pending: Migration[]
  /** Migrations já aplicadas cujo arquivo mudou depois. */
  drifted: { version: string; before: string; after: string }[]
}

export type Logger = (line: string) => void

async function ensureRegistry(sql: Sql): Promise<void> {
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
}

export async function readMigrationState(sql: Sql): Promise<MigrationState> {
  await ensureRegistry(sql)

  const applied = await sql<{ version: string; checksum: string }[]>`
    select version, checksum from migrations.schema_migrations
  `
  const appliedByVersion = new Map(applied.map((row) => [row.version, row.checksum]))

  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort()
  const pending: Migration[] = []
  const drifted: MigrationState['drifted'] = []

  for (const file of files) {
    const version = file.replace(/\.sql$/, '')
    const sqlText = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
    const checksum = createHash('sha256').update(sqlText).digest('hex').slice(0, 16)
    const previous = appliedByVersion.get(version)

    if (previous === undefined) pending.push({ version, sqlText, checksum })
    // Migration já aplicada que mudou de conteúdo: alerta, não reaplica.
    else if (previous !== checksum) drifted.push({ version, before: previous, after: checksum })
  }

  return { total: files.length, applied: applied.length, pending, drifted }
}

export async function applyPending(sql: Sql, pending: Migration[], log: Logger = console.log): Promise<void> {
  for (const item of pending) {
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(item.sqlText)
        await tx`
          insert into migrations.schema_migrations (version, checksum)
          values (${item.version}, ${item.checksum})
        `
      })
      log(`  ✓ ${item.version}`)
    } catch (error) {
      log(`  ✗ ${item.version}`)
      throw new Error(
        `${(error as Error).message}\n\nNada desta migration ficou aplicado: a transação foi revertida.`,
      )
    }
  }
}
