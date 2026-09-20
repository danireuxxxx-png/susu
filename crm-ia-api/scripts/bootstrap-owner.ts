/**
 * Cria o dono, a organização, o funil padrão e o catálogo de soluções.
 * É idempotente — rodar de novo não duplica nada.
 *
 *   OWNER_EMAIL=voce@empresa.com OWNER_PASSWORD='...' \
 *   ORGANIZATION_NAME='Sua Empresa' npm run bootstrap
 *
 * Para um CRM completo em um comando (migrations + isto + conferência),
 * use `npm run setup`.
 */
import postgres from 'postgres'
import { env } from '../src/env.js'
import { bootstrapOwner } from './lib/bootstrap.js'

const email = process.env.OWNER_EMAIL
const password = process.env.OWNER_PASSWORD
const existingUserId = process.env.OWNER_USER_ID

if (!existingUserId && (!email || !password)) {
  console.error('Defina OWNER_EMAIL e OWNER_PASSWORD — ou OWNER_USER_ID, se o usuário já existe.')
  process.exit(1)
}

if (!existingUserId && password && password.length < 8) {
  console.error('A senha precisa de ao menos 8 caracteres.')
  process.exit(1)
}

const sql = postgres(env.DATABASE_URL, { ssl: env.DATABASE_SSL ? 'require' : false, max: 1 })
const organizationName = process.env.ORGANIZATION_NAME ?? 'Minha empresa'

try {
  const result = await bootstrapOwner(sql, {
    email,
    password,
    ownerName: process.env.OWNER_NAME ?? 'Administrador',
    organizationName,
    existingUserId,
  })

  console.log(`
Pronto. Acesse o CRM com:

  e-mail: ${email ?? '(o do usuário informado)'}
  organização: ${organizationName} (${result.organizationId})

A senha é a que você informou em OWNER_PASSWORD.
`)
} catch (error) {
  console.error(`\n${(error as Error).message}`)
  await sql.end()
  process.exit(1)
}

await sql.end()
