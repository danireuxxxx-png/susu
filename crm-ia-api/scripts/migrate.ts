/**
 * Aplicador de migrations.
 *
 *   npm run migrate              aplica o que falta
 *   npm run migrate -- --status  só lista o estado
 *
 * Use a conexão DIRETA do Supabase (porta 5432), não o pooler: DDL em
 * transação não combina com pool em modo transaction.
 */
import postgres from 'postgres'
import { env } from '../src/env.js'
import { applyPending, readMigrationState } from './lib/migrations.js'

const statusOnly = process.argv.includes('--status')

const sql = postgres(env.DATABASE_URL, {
  ssl: env.DATABASE_SSL ? 'require' : false,
  max: 1,
  // DDL com muitos statements: sem timeout curto.
  idle_timeout: 0,
  connect_timeout: 30,
  // As migrations conversam por NOTICE; só o que for aviso de verdade sobe.
  onnotice: (notice) => {
    if (notice.severity && notice.severity !== 'NOTICE') console.warn(`  ⚠ ${notice.message}`)
  },
})

try {
  const state = await readMigrationState(sql)

  for (const item of state.drifted) {
    console.warn(`⚠  ${item.version} foi alterada depois de aplicada (checksum ${item.before} → ${item.after}).`)
    console.warn('   Crie uma migration nova em vez de editar uma que já rodou.')
  }

  console.log(
    `${state.total} migrations no repositório · ${state.applied} aplicadas · ${state.pending.length} pendentes`,
  )

  if (statusOnly || state.pending.length === 0) {
    if (state.pending.length) {
      console.log('\nPendentes:')
      for (const item of state.pending) console.log(`  · ${item.version}`)
    } else {
      console.log('Banco em dia.')
    }
  } else {
    console.log('')
    await applyPending(sql, state.pending)
    console.log(`\n${state.pending.length} migration(s) aplicada(s).`)
  }
} catch (error) {
  console.error(`\n${(error as Error).message}`)
  await sql.end()
  process.exit(1)
}

await sql.end()
