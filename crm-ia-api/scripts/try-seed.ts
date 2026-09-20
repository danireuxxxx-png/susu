import { createDatabase } from './pg-harness.js'

try {
  const db = await createDatabase({ withSeed: true })
  console.log('SEED OK')
  await db.close()
} catch (error) {
  const err = error as { message?: string; cause?: { message?: string; detail?: string } }
  console.log('ERRO:', err.message?.slice(0, 300))
  if (err.cause?.detail) console.log('DETALHE:', err.cause.detail.slice(0, 200))
}
