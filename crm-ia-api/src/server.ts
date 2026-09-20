import { env } from './env.js'
import { buildApp } from './app.js'
import { closeDatabase } from './lib/db.js'

const app = await buildApp()

async function shutdown(signal: string) {
  app.log.info({ signal }, 'encerrando')
  try {
    await app.close()
    await closeDatabase()
    process.exit(0)
  } catch (error) {
    app.log.error({ error }, 'falha ao encerrar')
    process.exit(1)
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

try {
  await app.listen({ port: env.PORT, host: env.HOST })
} catch (error) {
  app.log.error({ error }, 'falha ao iniciar o servidor')
  process.exit(1)
}
