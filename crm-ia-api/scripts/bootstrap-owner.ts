/**
 * Primeiro acesso de um ambiente novo.
 *
 * Cria o usuário dono, a organização e o mínimo para o CRM já abrir
 * utilizável: funil padrão com as oito etapas e o catálogo de produtos.
 * É idempotente — rodar de novo não duplica nada.
 *
 *   OWNER_EMAIL=voce@empresa.com OWNER_PASSWORD='...' \
 *   ORGANIZATION_NAME='Sua Empresa' npm run bootstrap
 */
import postgres from 'postgres'
import { env } from '../src/env.js'
import { getSupabaseAdmin } from '../src/lib/supabase.js'

const email = process.env.OWNER_EMAIL
const password = process.env.OWNER_PASSWORD
const organizationName = process.env.ORGANIZATION_NAME ?? 'Minha empresa'
const ownerName = process.env.OWNER_NAME ?? 'Administrador'
// Quem já criou o usuário pelo painel do Supabase informa só o id aqui.
const existingUserId = process.env.OWNER_USER_ID

if (!existingUserId && (!email || !password)) {
  console.error('Defina OWNER_EMAIL e OWNER_PASSWORD — ou OWNER_USER_ID, se o usuário já existe.')
  process.exit(1)
}

if (!existingUserId && password && password.length < 8) {
  console.error('A senha precisa de ao menos 8 caracteres.')
  process.exit(1)
}

// 1. Usuário no Supabase Auth (ou o que já existe com esse e-mail).
let userId: string | undefined = existingUserId

if (!userId) {
  const admin = getSupabaseAdmin()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email!,
    password: password!,
    email_confirm: true,
    user_metadata: { name: ownerName },
  })

  if (created?.user) {
    userId = created.user.id
    console.log(`usuário criado: ${email}`)
  } else if (createError && /already|registered|exists/i.test(createError.message)) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
    userId = list?.users.find((user) => user.email?.toLowerCase() === email!.toLowerCase())?.id
    console.log(`usuário já existia: ${email}`)
  } else if (createError) {
    console.error(`falha ao criar usuário: ${createError.message}`)
    process.exit(1)
  }
}

if (!userId) {
  console.error('não foi possível resolver o id do usuário')
  process.exit(1)
}

const sql = postgres(env.DATABASE_URL, { ssl: env.DATABASE_SSL ? 'require' : false, max: 1 })

// 2. Perfil, organização e vínculo de OWNER, em uma transação.
const organizationId = await sql.begin(async (tx) => {
  await tx`
    insert into public.profiles (id, name, email)
    values (${userId}, ${ownerName}, ${email ?? null})
    on conflict (id) do update set
      name = coalesce(nullif(excluded.name, ''), public.profiles.name),
      email = coalesce(excluded.email, public.profiles.email)
  `

  const [existing] = await tx<{ organization_id: string }[]>`
    select organization_id from public.organization_members
    where user_id = ${userId} and status = 'ACTIVE'
    limit 1
  `

  if (existing) {
    console.log('organização já vinculada a este usuário')
    return existing.organization_id
  }

  const [organization] = await tx<{ id: string }[]>`
    insert into public.organizations (name) values (${organizationName}) returning id
  `

  await tx`
    insert into public.organization_members (organization_id, user_id, role, status)
    values (${organization!.id}, ${userId}, 'OWNER', 'ACTIVE')
  `

  console.log(`organização criada: ${organizationName}`)
  return organization!.id
})

// 3. Funil padrão — sem ele não dá para criar oportunidade.
const [pipeline] = await sql<{ id: string }[]>`
  select id from public.pipelines where organization_id = ${organizationId} and is_default limit 1
`

if (pipeline) {
  console.log('funil padrão já existe')
} else {
  await sql.begin(async (tx) => {
    const [created] = await tx<{ id: string }[]>`
      insert into public.pipelines (organization_id, name, description, is_default)
      values (${organizationId}, 'Funil comercial', 'Funil padrão', true)
      returning id
    `

    const stages: [string, number, number, boolean, boolean][] = [
      ['Novo Lead', 0, 10, false, false],
      ['Qualificação', 1, 25, false, false],
      ['Reunião Agendada', 2, 40, false, false],
      ['Diagnóstico', 3, 55, false, false],
      ['Proposta Enviada', 4, 70, false, false],
      ['Negociação', 5, 85, false, false],
      ['Fechado / Ganho', 6, 100, true, false],
      ['Fechado / Perdido', 7, 0, false, true],
    ]

    for (const [name, position, probability, isWon, isLost] of stages) {
      await tx`
        insert into public.pipeline_stages (pipeline_id, name, position, probability, is_won, is_lost)
        values (${created!.id}, ${name}, ${position}, ${probability}, ${isWon}, ${isLost})
      `
    }
  })
  console.log('funil padrão criado com 8 etapas')
}

// 4. Catálogo inicial de soluções.
const [productCount] = await sql<{ total: string }[]>`
  select count(*)::text as total from public.products where organization_id = ${organizationId}
`

if (Number(productCount?.total ?? 0) === 0) {
  const products: [string, string, number][] = [
    ['Agente de IA', 'AI_AGENT', 8000],
    ['Automação comercial', 'AUTOMATION', 4000],
    ['Chatbot de atendimento', 'CHATBOT', 3500],
    ['Integração de sistemas', 'INTEGRATION', 3000],
    ['Consultoria em IA', 'CONSULTING', 9000],
    ['Suporte e sustentação', 'SUPPORT', 2500],
  ]

  for (const [name, category, price] of products) {
    await sql`
      insert into public.products (organization_id, name, category, default_price, billing_type)
      values (${organizationId}, ${name}, ${category}::public.product_category, ${price},
              ${category === 'CONSULTING' ? 'ONE_TIME' : 'MONTHLY'}::public.billing_type)
    `
  }
  console.log(`catálogo criado com ${products.length} soluções`)
}

await sql.end()

console.log(`
Pronto. Acesse o CRM com:

  e-mail: ${email ?? '(o do usuário informado)'}
  organização: ${organizationName} (${organizationId})

A senha é a que você informou em OWNER_PASSWORD.
`)
