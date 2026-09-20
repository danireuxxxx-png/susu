/**
 * Confere os arquivos de `supabase/instalar` contra um Postgres de verdade,
 * do zero — exatamente o que o SQL Editor do Supabase vai fazer.
 *
 *   npm run build:sql && npm run verify:sql
 */
import { readFile } from 'node:fs/promises'
import { createDatabase } from './pg-harness.js'

const db = await createDatabase({ withMigrations: false })
const banco = await readFile(new URL('../supabase/instalar/1-banco.sql', import.meta.url), 'utf8')
const dono = await readFile(new URL('../supabase/instalar/2-dono.sql', import.meta.url), 'utf8')

// O usuário que o painel do Supabase criaria em Authentication → Users.
await db.exec(`insert into auth.users (id, email) values (gen_random_uuid(), 'dono@iacentrism.ai');`)

console.log('1-banco.sql ...')
await db.exec(banco)
const saude = await db.query<{ tabelas: number; policies: number; sem_rls: number }>(`
  select
    (select count(*) from pg_tables where schemaname = 'public')  as tabelas,
    (select count(*) from pg_policies where schemaname = 'public') as policies,
    (select count(*) from pg_tables t
       join pg_class c on c.relname = t.tablename and c.relnamespace = 'public'::regnamespace
     where t.schemaname = 'public' and not c.relrowsecurity)       as sem_rls
`)
console.log('   ', saude.rows[0])

const registro = await db.query<{ total: number }>('select count(*)::int as total from migrations.schema_migrations')
console.log('    migrations registradas:', registro.rows[0]!.total)

console.log('rodar 1-banco.sql de novo (deve recusar sem alterar nada) ...')
try {
  await db.exec(banco)
  console.log('    ✗ NÃO recusou — idempotência quebrada')
  process.exit(1)
} catch (error) {
  console.log('   ', (error as Error).message.split('\n')[0])
  // O SQL Editor abre uma conexão por execução; aqui a mesma sessão
  // continua, então a transação abortada precisa ser encerrada à mão.
  await db.exec('rollback')
}

console.log('2-dono.sql ...')
// O arquivo vem com um e-mail de exemplo na linha que o usuário edita;
// aqui ela aponta para o usuário de teste.
const comEmail = dono.replace(/v_email\s+text := '[^']*'/, "v_email text := 'dono@iacentrism.ai'")
await db.exec(comEmail)
const dados = await db.query<{ email: string; role: string; organizacao: string }>(`
  select p.email, m.role::text as role, o.name as organizacao
  from public.organization_members m
  join public.organizations o on o.id = m.organization_id
  join public.profiles p on p.id = m.user_id
`)
console.log('   ', dados.rows[0])

const etapas = await db.query<{ total: number }>('select count(*)::int as total from public.pipeline_stages')
const produtos = await db.query<{ total: number }>('select count(*)::int as total from public.products')
console.log(`    etapas: ${etapas.rows[0]!.total} · produtos: ${produtos.rows[0]!.total}`)

console.log('rodar 2-dono.sql de novo (não pode duplicar) ...')
await db.exec(comEmail)
const depois = await db.query<{ orgs: number; etapas: number; produtos: number }>(`
  select (select count(*)::int from public.organizations) as orgs,
         (select count(*)::int from public.pipeline_stages) as etapas,
         (select count(*)::int from public.products) as produtos
`)
console.log('   ', depois.rows[0])

const r = depois.rows[0]!
if (r.orgs !== 1 || r.etapas !== 8 || r.produtos !== 6) {
  console.log('    ✗ duplicou')
  process.exit(1)
}
console.log('\n✓ os dois arquivos fazem o que prometem')
await db.close()
