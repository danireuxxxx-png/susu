/**
 * Instalação em um comando.
 *
 *   npm run setup
 *
 * Confere a configuração, aplica as migrations, cria o dono e a
 * organização e prova que a coisa toda responde — na ordem, parando no
 * primeiro passo que falhar e dizendo o que fazer. Rodar de novo é
 * seguro: nada aqui duplica nada.
 *
 * Sem terminal interativo (CI), os dados do dono vêm de OWNER_EMAIL,
 * OWNER_PASSWORD, OWNER_NAME e ORGANIZATION_NAME.
 */
import { createInterface } from 'node:readline'
import postgres from 'postgres'
import { env } from '../src/env.js'
import { bootstrapOwner } from './lib/bootstrap.js'
import { applyPending, readMigrationState } from './lib/migrations.js'

const interactive = process.stdin.isTTY === true

function ask(query: string, { hidden = false } = {}): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      if (hidden) process.stdout.write('\n')
      rl.close()
      resolve(answer.trim())
    })
    // A senha continua sendo lida, só não é ecoada.
    if (hidden) (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = () => {}
  })
}

function fail(message: string, hint?: string): never {
  console.error(`\n✗ ${message}`)
  if (hint) console.error(`\n  ${hint}`)
  process.exit(1)
}

const step = (n: number, title: string) => console.log(`\n[${n}/4] ${title}`)

console.log('\nIA.centrism CRM — instalação\n' + '─'.repeat(34))

// ─── 1. Configuração ────────────────────────────────────────────────
step(1, 'Configuração')

if (/:6543\b/.test(env.DATABASE_URL)) {
  fail(
    'DATABASE_URL aponta para o pooler (porta 6543).',
    'As migrations precisam da conexão DIRETA (porta 5432): Supabase → Project Settings →\n  Database → Connection string. O pooler fica para a API em produção.',
  )
}

const hasServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_URL)
const existingUserId = process.env.OWNER_USER_ID

if (!hasServiceRole && !existingUserId) {
  fail(
    'Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
    'São elas que criam o usuário dono no Supabase Auth (Project Settings → API).\n  Se o usuário já existe, informe OWNER_USER_ID e rode de novo.',
  )
}

console.log(`  ✓ banco: ${env.DATABASE_URL.replace(/:\/\/[^@]+@/, '://***@')}`)
console.log(`  ✓ supabase: ${env.SUPABASE_URL ?? '(só banco)'}`)

// Dados do dono: do ambiente ou perguntados na hora.
let email = process.env.OWNER_EMAIL
let password = process.env.OWNER_PASSWORD
let ownerName = process.env.OWNER_NAME
let organizationName = process.env.ORGANIZATION_NAME

if (!existingUserId && interactive) {
  console.log('')
  if (!email) email = await ask('  E-mail do dono: ')
  if (!password) password = await ask('  Senha (não aparece na tela): ', { hidden: true })
  if (!ownerName) ownerName = await ask('  Seu nome: ')
  if (!organizationName) organizationName = await ask('  Nome da empresa [IA.centrism]: ')
}

if (!existingUserId && (!email || !password)) {
  fail(
    'Faltam os dados do dono.',
    'Defina OWNER_EMAIL e OWNER_PASSWORD, ou rode em um terminal interativo.',
  )
}

if (password && password.length < 8) fail('A senha precisa de ao menos 8 caracteres.')

ownerName ||= 'Administrador'
organizationName ||= 'IA.centrism'

const sql = postgres(env.DATABASE_URL, {
  ssl: env.DATABASE_SSL ? 'require' : false,
  max: 1,
  idle_timeout: 0,
  connect_timeout: 30,
  // As migrations conversam por NOTICE; só o que for aviso de verdade sobe.
  onnotice: (notice) => {
    if (notice.severity && notice.severity !== 'NOTICE') console.warn(`  ⚠ ${notice.message}`)
  },
})

// ─── 2. Migrations ──────────────────────────────────────────────────
step(2, 'Schema')

try {
  const rows = await sql<{ version: string }[]>`select version()`
  console.log(`  ✓ conectado — ${rows[0]!.version.split(' ').slice(0, 2).join(' ')}`)
} catch (error) {
  await sql.end({ timeout: 1 }).catch(() => {})
  fail(
    `não foi possível conectar no banco: ${(error as Error).message}`,
    'Confira a senha na DATABASE_URL e, se sua rede não tem IPv6, use a URI do\n  Session pooler (host ...pooler.supabase.com, porta 5432).',
  )
}

try {
  const state = await readMigrationState(sql)

  for (const item of state.drifted) {
    console.warn(`  ⚠ ${item.version} mudou depois de aplicada — crie uma migration nova em vez de editar.`)
  }

  if (state.pending.length === 0) {
    console.log(`  · ${state.applied} migrations já aplicadas, banco em dia`)
  } else {
    console.log(`  · aplicando ${state.pending.length} de ${state.total} migrations`)
    await applyPending(sql, state.pending, (line) => console.log(`  ${line.trim()}`))
  }
} catch (error) {
  await sql.end({ timeout: 1 }).catch(() => {})
  fail((error as Error).message)
}

// A última migration confere RLS em toda tabela de negócio; esta é a
// mesma conferência, agora como número no relatório.
const [health] = await sql<{ tables: string; policies: string; without_rls: string }[]>`
  select
    (select count(*)::text from pg_tables where schemaname = 'public') as tables,
    (select count(*)::text from pg_policies where schemaname = 'public') as policies,
    (select count(*)::text from pg_tables t
      join pg_class c on c.relname = t.tablename and c.relnamespace = 'public'::regnamespace
      where t.schemaname = 'public' and not c.relrowsecurity) as without_rls
`
console.log(`  ✓ ${health!.tables} tabelas · ${health!.policies} policies · ${health!.without_rls} sem RLS`)

if (Number(health!.without_rls) > 0) {
  await sql.end({ timeout: 1 }).catch(() => {})
  fail('há tabela sem RLS — o isolamento entre organizações não está garantido.')
}

// ─── 3. Dono e organização ──────────────────────────────────────────
step(3, 'Dono e organização')

let organizationId: string
try {
  const result = await bootstrapOwner(
    sql,
    { email, password, ownerName, organizationName, existingUserId },
    (line) => console.log(`  ${line.trim()}`),
  )
  organizationId = result.organizationId
} catch (error) {
  await sql.end({ timeout: 1 }).catch(() => {})
  fail((error as Error).message)
}

await sql.end()

// ─── 4. Conferência de ponta a ponta ────────────────────────────────
step(4, 'Conferência')

if (!email || !password || !env.SUPABASE_ANON_KEY) {
  console.log('  · login não testado (faltam credenciais do dono ou SUPABASE_ANON_KEY)')
} else {
  const { buildApp } = await import('../src/app.js')
  const { closeDatabase } = await import('../src/lib/db.js')
  const app = await buildApp()

  try {
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password },
    })

    if (login.statusCode !== 200) {
      throw new Error(`login devolveu ${login.statusCode}: ${login.body.slice(0, 200)}`)
    }

    const token = login.json().data.session.accessToken as string
    console.log('  ✓ login')

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    const membership = me.json().data.memberships?.[0]
    console.log(`  ✓ perfil — ${membership?.role ?? '?'} em ${membership?.organization_name ?? '?'}`)

    const summary = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/summary',
      headers: { authorization: `Bearer ${token}`, 'x-organization-id': organizationId },
    })
    if (summary.statusCode !== 200) throw new Error(`dashboard devolveu ${summary.statusCode}`)
    console.log('  ✓ cálculos financeiros respondendo')
  } catch (error) {
    console.log(`  ✗ ${(error as Error).message}`)
    await app.close()
    await closeDatabase()
    fail('o banco está pronto, mas a API não fechou o circuito.')
  }

  await app.close()
  await closeDatabase()
}

console.log(`
${'─'.repeat(34)}
Pronto. O banco está de pé e a organização criada.

  e-mail:      ${email ?? '(usuário informado)'}
  organização: ${organizationName}
  id:          ${organizationId}

Próximos passos (detalhes em DEPLOY.md):

  1. Publique a API  — Render, com a string do POOLER (6543) em DATABASE_URL
  2. Publique o site — Vercel, Root Directory 'crm-ia',
                       VITE_API_URL=https://<sua-api>/api/v1
  3. Libere o CORS   — CORS_ORIGINS na API com o domínio da Vercel
`)
