/** Aplica todas as migrations em um Postgres limpo e resume o schema. */
import { createDatabase } from './pg-harness.js'

const db = await createDatabase()

const tables = await db.query<{ count: number }>(
  `select count(*)::int as count from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'`,
)
const views = await db.query<{ count: number }>(
  `select count(*)::int as count from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'v'`,
)
const policies = await db.query<{ count: number }>(
  `select count(*)::int as count from pg_policies where schemaname = 'public'`,
)
const functions = await db.query<{ count: number }>(
  `select count(*)::int as count from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'`,
)
const indexes = await db.query<{ count: number }>(
  `select count(*)::int as count from pg_indexes where schemaname = 'public'`,
)
const insecureViews = await db.query<{ viewname: string }>(
  `select c.relname as viewname
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'v'
     and coalesce((select option_value from pg_options_to_table(c.reloptions)
                   where option_name = 'security_invoker'), 'false') <> 'true'`,
)

console.log('migrations aplicadas com sucesso')
console.log(`  tabelas ........ ${tables.rows[0]?.count}`)
console.log(`  views .......... ${views.rows[0]?.count}`)
console.log(`  índices ........ ${indexes.rows[0]?.count}`)
console.log(`  funções ........ ${functions.rows[0]?.count}`)
console.log(`  policies RLS ... ${policies.rows[0]?.count}`)
console.log(
  insecureViews.rows.length
    ? `  ⚠ views sem security_invoker: ${insecureViews.rows.map((v) => v.viewname).join(', ')}`
    : '  views: todas com security_invoker',
)

await db.close()
