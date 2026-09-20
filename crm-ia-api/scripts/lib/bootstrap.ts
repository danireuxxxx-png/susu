/**
 * Primeiro acesso de um ambiente novo, compartilhado pelo `bootstrap` e
 * pelo `setup`: usuário dono, organização, funil padrão e catálogo.
 * Tudo idempotente — rodar de novo não duplica nada.
 */
import type { Sql } from 'postgres'
import { getSupabaseAdmin } from '../../src/lib/supabase.js'
import type { Logger } from './migrations.js'

export interface BootstrapOptions {
  email?: string
  password?: string
  ownerName: string
  organizationName: string
  /** Quem já criou o usuário no painel do Supabase informa só o id. */
  existingUserId?: string
}

export interface BootstrapResult {
  userId: string
  organizationId: string
}

const STAGES: [name: string, position: number, probability: number, isWon: boolean, isLost: boolean][] = [
  ['Novo Lead', 0, 10, false, false],
  ['Qualificação', 1, 25, false, false],
  ['Reunião Agendada', 2, 40, false, false],
  ['Diagnóstico', 3, 55, false, false],
  ['Proposta Enviada', 4, 70, false, false],
  ['Negociação', 5, 85, false, false],
  ['Fechado / Ganho', 6, 100, true, false],
  ['Fechado / Perdido', 7, 0, false, true],
]

const PRODUCTS: [name: string, category: string, price: number][] = [
  ['Agente de IA', 'AI_AGENT', 8000],
  ['Automação comercial', 'AUTOMATION', 4000],
  ['Chatbot de atendimento', 'CHATBOT', 3500],
  ['Integração de sistemas', 'INTEGRATION', 3000],
  ['Consultoria em IA', 'CONSULTING', 9000],
  ['Suporte e sustentação', 'SUPPORT', 2500],
]

/** Cria o usuário no Supabase Auth, ou reaproveita o que já existe com esse e-mail. */
async function resolveUser(options: BootstrapOptions, log: Logger): Promise<string> {
  if (options.existingUserId) return options.existingUserId

  const admin = getSupabaseAdmin()
  const email = options.email!

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: options.password!,
    email_confirm: true,
    user_metadata: { name: options.ownerName },
  })

  if (created?.user) {
    log(`  ✓ usuário criado: ${email}`)
    return created.user.id
  }

  if (error && /already|registered|exists/i.test(error.message)) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
    const found = list?.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (!found) throw new Error(`o e-mail ${email} já existe no Auth, mas não foi possível recuperá-lo`)
    log(`  · usuário já existia: ${email}`)
    return found.id
  }

  throw new Error(`falha ao criar usuário: ${error?.message ?? 'motivo desconhecido'}`)
}

export async function bootstrapOwner(
  sql: Sql,
  options: BootstrapOptions,
  log: Logger = console.log,
): Promise<BootstrapResult> {
  const userId = await resolveUser(options, log)

  // Perfil, organização e vínculo de OWNER, em uma transação.
  const organizationId = await sql.begin(async (tx) => {
    await tx`
      insert into public.profiles (id, name, email)
      values (${userId}, ${options.ownerName}, ${options.email ?? null})
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
      log('  · organização já vinculada a este usuário')
      return existing.organization_id
    }

    const [organization] = await tx<{ id: string }[]>`
      insert into public.organizations (name) values (${options.organizationName}) returning id
    `

    await tx`
      insert into public.organization_members (organization_id, user_id, role, status)
      values (${organization!.id}, ${userId}, 'OWNER', 'ACTIVE')
    `

    log(`  ✓ organização criada: ${options.organizationName}`)
    return organization!.id
  })

  // Funil padrão — sem ele não dá para criar oportunidade.
  const [pipeline] = await sql<{ id: string }[]>`
    select id from public.pipelines where organization_id = ${organizationId} and is_default limit 1
  `

  if (pipeline) {
    log('  · funil padrão já existe')
  } else {
    await sql.begin(async (tx) => {
      const [created] = await tx<{ id: string }[]>`
        insert into public.pipelines (organization_id, name, description, is_default)
        values (${organizationId}, 'Funil comercial', 'Funil padrão', true)
        returning id
      `

      for (const [name, position, probability, isWon, isLost] of STAGES) {
        await tx`
          insert into public.pipeline_stages (pipeline_id, name, position, probability, is_won, is_lost)
          values (${created!.id}, ${name}, ${position}, ${probability}, ${isWon}, ${isLost})
        `
      }
    })
    log(`  ✓ funil padrão criado com ${STAGES.length} etapas`)
  }

  // Catálogo inicial de soluções.
  const [productCount] = await sql<{ total: string }[]>`
    select count(*)::text as total from public.products where organization_id = ${organizationId}
  `

  if (Number(productCount?.total ?? 0) > 0) {
    log('  · catálogo já existe')
  } else {
    for (const [name, category, price] of PRODUCTS) {
      await sql`
        insert into public.products (organization_id, name, category, default_price, billing_type)
        values (${organizationId}, ${name}, ${category}::public.product_category, ${price},
                ${category === 'CONSULTING' ? 'ONE_TIME' : 'MONTHLY'}::public.billing_type)
      `
    }
    log(`  ✓ catálogo criado com ${PRODUCTS.length} soluções`)
  }

  return { userId, organizationId }
}
