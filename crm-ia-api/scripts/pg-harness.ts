/**
 * Banco Postgres local sem Docker.
 *
 * O PGlite é o Postgres compilado para WASM: dá para aplicar as mesmas
 * migrations do Supabase, exercitar RLS de verdade e validar os cálculos
 * financeiros em segundos. O que ele não tem é o Supabase em volta —
 * então este arquivo recria o mínimo do schema `auth` (tabela users,
 * auth.uid(), papéis) que as migrations esperam encontrar.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const MIGRATIONS_DIR = fileURLToPath(new URL('../supabase/migrations', import.meta.url))

/** Recria o contrato mínimo do Supabase (auth + papéis do PostgREST). */
const SUPABASE_BOOTSTRAP = /* sql */ `
  create schema if not exists auth;

  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    encrypted_password text,
    email_confirmed_at timestamptz,
    raw_app_meta_data jsonb not null default '{}'::jsonb,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    aud text default 'authenticated',
    role text default 'authenticated',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Mesma implementação do Supabase: lê o JWT da sessão atual.
  create or replace function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid;
  $$;

  create or replace function auth.role() returns text
  language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claims', true)::json ->> 'role', ''),
      current_setting('role', true)
    );
  $$;

  do $$
  begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
      create role anon nologin noinherit;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin noinherit;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then
      create role service_role nologin noinherit bypassrls;
    end if;
  end
  $$;

  grant usage on schema public to anon, authenticated, service_role;
  grant usage on schema auth to anon, authenticated, service_role;
  grant select on auth.users to authenticated, service_role;
`

export async function listMigrations() {
  const files = await readdir(MIGRATIONS_DIR)
  return files.filter((file) => file.endsWith('.sql')).sort()
}

export async function readMigration(file: string) {
  return readFile(join(MIGRATIONS_DIR, file), 'utf8')
}

export interface HarnessOptions {
  /** Aplica supabase/seed.sql depois das migrations. */
  withSeed?: boolean
  dataDir?: string
}

export async function createDatabase(options: HarnessOptions = {}) {
  const db = new PGlite(options.dataDir)
  await db.exec(SUPABASE_BOOTSTRAP)

  for (const file of await listMigrations()) {
    const sql = await readMigration(file)
    try {
      await db.exec(sql)
    } catch (error) {
      throw new Error(`migration ${file} falhou: ${(error as Error).message}`)
    }
  }

  if (options.withSeed) {
    const seed = await readFile(fileURLToPath(new URL('../supabase/seed.sql', import.meta.url)), 'utf8')
    await db.exec(seed)
  }

  return db
}

/** Executa um bloco como um usuário autenticado específico (RLS ligado). */
export async function asUser<T>(
  db: PGlite,
  userId: string | null,
  run: (db: PGlite) => Promise<T>,
): Promise<T> {
  const claims = userId ? JSON.stringify({ sub: userId, role: 'authenticated' }) : JSON.stringify({})
  await db.exec(`set role authenticated; select set_config('request.jwt.claims', '${claims}', false);`)
  try {
    return await run(db)
  } finally {
    await db.exec(`select set_config('request.jwt.claims', '', false); reset role;`)
  }
}
