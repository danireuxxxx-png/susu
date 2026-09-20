/**
 * Postgres local para desenvolvimento, sem Docker.
 *
 * Sobe o PGlite (Postgres em WASM) com as migrations e o seed aplicados e
 * o expõe na porta TCP 5433 falando o protocolo do Postgres — então a API
 * conecta nele exatamente como conectaria no Supabase.
 *
 * Para valer em produção, aponte DATABASE_URL para o Postgres do Supabase.
 */
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { createDatabase } from './pg-harness.js'

const port = Number(process.env.LOCAL_DB_PORT ?? 5433)

const db = await createDatabase({ withSeed: true })
const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' })

await server.start()

console.log(`Postgres local pronto em postgres://postgres:postgres@127.0.0.1:${port}/postgres`)
console.log('Migrations e seed aplicados. Ctrl+C encerra.')

const shutdown = async () => {
  await server.stop()
  await db.close()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())
