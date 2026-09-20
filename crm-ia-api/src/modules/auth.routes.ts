import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { withUser } from '../lib/db.js'
import { AppError, unauthorized } from '../lib/errors.js'
import { getSupabaseAuth } from '../lib/supabase.js'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'A senha precisa de ao menos 8 caracteres'),
})

/**
 * Autenticação.
 *
 * O Supabase Auth cuida de senha, sessão e refresh — a API não guarda
 * nem processa senha em nenhum momento, apenas repassa para o Supabase e
 * devolve os tokens. Nenhuma chave de serviço é usada aqui.
 */
export const authRoutes = async (app: FastifyInstance) => {
  app.post('/auth/login', async (request, reply) => {
    const body = credentialsSchema.parse(request.body)

    const { data, error } = await getSupabaseAuth().auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    // Mensagem genérica de propósito: não revela se o e-mail existe.
    if (error || !data.session) {
      request.log.warn({ email: body.email }, 'tentativa de login rejeitada')
      throw unauthorized('E-mail ou senha inválidos')
    }

    const memberships = await withUser({ userId: data.user.id }, (tx) => tx`
      select m.organization_id, m.role, o.name as organization_name
      from public.organization_members m
      join public.organizations o on o.id = m.organization_id
      where m.user_id = ${data.user.id} and m.status = 'ACTIVE'
      order by m.created_at
    `)

    await app.recordAudit({
      organizationId: memberships[0]?.organization_id as string | undefined,
      actorId: data.user.id,
      action: 'LOGIN',
      entity: 'auth',
      request,
    })

    reply.code(200)
    return {
      data: {
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
          tokenType: data.session.token_type,
        },
        user: { id: data.user.id, email: data.user.email },
        memberships,
      },
    }
  })

  app.post('/auth/refresh', async (request) => {
    const { refreshToken } = z.object({ refreshToken: z.string().min(10) }).parse(request.body)

    const { data, error } = await getSupabaseAuth().auth.refreshSession({ refresh_token: refreshToken })

    if (error || !data.session) throw unauthorized('Não foi possível renovar a sessão')

    return {
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    }
  })

  app.post('/auth/logout', { preHandler: app.authenticate }, async (request) => {
    await app.recordAudit({
      organizationId: request.organizationId,
      actorId: request.user.id,
      action: 'LOGOUT',
      entity: 'auth',
      request,
    })

    // A sessão é invalidada no Supabase pelo próprio cliente; aqui só
    // registramos o evento na trilha de auditoria.
    return { data: { success: true } }
  })

  app.post('/auth/password-recovery', async (request) => {
    const { email, redirectTo } = z
      .object({ email: z.string().email(), redirectTo: z.string().url().optional() })
      .parse(request.body)

    await getSupabaseAuth().auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined)

    // Resposta sempre igual: não confirma se o e-mail está cadastrado.
    return { data: { message: 'Se o e-mail estiver cadastrado, enviaremos as instruções.' } }
  })

  app.get('/auth/me', { preHandler: app.authenticate }, async (request) => {
    const data = await withUser({ userId: request.user.id }, async (tx) => {
      const [profile] = await tx`
        select id, name, email, phone, avatar_url, created_at
        from public.profiles where id = ${request.user.id}
      `
      const memberships = await tx`
        select m.organization_id, m.role, m.status, o.name as organization_name,
               o.currency, o.timezone, o.logo_url
        from public.organization_members m
        join public.organizations o on o.id = m.organization_id
        where m.user_id = ${request.user.id} and m.status = 'ACTIVE'
        order by m.created_at
      `
      return { profile, memberships }
    })

    return {
      data: {
        user: data.profile ?? { id: request.user.id, email: request.user.email },
        memberships: data.memberships,
        currentOrganizationId: request.organizationId,
        role: request.organizationRole,
      },
    }
  })

  app.patch('/auth/me', { preHandler: app.authenticate }, async (request) => {
    const body = z
      .object({
        name: z.string().trim().min(1).max(160).optional(),
        phone: z.string().trim().max(40).optional(),
        avatarUrl: z.string().url().optional(),
      })
      .parse(request.body)

    const row = await withUser({ userId: request.user.id }, async (tx) => {
      const [record] = await tx`
        update public.profiles
        set name = coalesce(${body.name ?? null}, name),
            phone = coalesce(${body.phone ?? null}, phone),
            avatar_url = coalesce(${body.avatarUrl ?? null}, avatar_url)
        where id = ${request.user.id}
        returning id, name, email, phone, avatar_url
      `
      return record
    })

    return { data: row }
  })

  /** Cria organização e vincula quem chamou como OWNER (transacional no banco). */
  app.post('/auth/organizations', { preHandler: app.authenticate }, async (request, reply) => {
    const body = z
      .object({
        name: z.string().trim().min(1).max(160),
        legalName: z.string().trim().max(200).optional(),
        document: z.string().trim().max(32).optional(),
        industry: z.string().trim().max(120).optional(),
        currency: z.string().length(3).optional(),
        timezone: z.string().max(60).optional(),
      })
      .parse(request.body)

    const organization = await withUser({ userId: request.user.id }, async (tx) => {
      const [row] = await tx<{ create_organization: unknown }[]>`
        select public.create_organization(
          ${body.name}::text,
          ${body.legalName ?? null}::text,
          ${body.document ?? null}::text,
          ${body.industry ?? null}::text,
          coalesce(${body.currency ?? null}, 'BRL')::char(3),
          coalesce(${body.timezone ?? null}, 'America/Sao_Paulo')::text
        ) as create_organization
      `
      return row?.create_organization
    })

    if (!organization) throw new AppError('Não foi possível criar a organização', 500, 'INTERNAL_ERROR')

    reply.code(201)
    return { data: organization }
  })
}
