/** Aplica migrations + seed e confere os números principais. */
import { createDatabase } from './pg-harness.js'

const db = await createDatabase({ withSeed: true })
const q = async <T>(sql: string) => (await db.query<T>(sql)).rows

const counts = await q<{ entity: string; total: number }>(`
  select 'empresas' as entity, count(*)::int as total from public.companies
  union all select 'contatos', count(*)::int from public.contacts
  union all select 'leads', count(*)::int from public.leads
  union all select 'oportunidades', count(*)::int from public.opportunities
  union all select 'projetos', count(*)::int from public.projects
  union all select 'custos de projeto', count(*)::int from public.project_costs
  union all select 'receitas', count(*)::int from public.revenues
  union all select 'despesas', count(*)::int from public.organization_expenses
  union all select 'atividades', count(*)::int from public.activities
  union all select 'metas', count(*)::int from public.goals
  union all select 'audit logs', count(*)::int from public.audit_logs
`)
console.table(counts)

console.log('\nRentabilidade por cliente (top 5 por lucro):')
console.table(
  await q(`
    select company_name, projects_active, monthly_revenue, monthly_cost, monthly_profit, margin
    from public.company_economics_at(current_date)
    where projects_total > 0
    order by monthly_profit desc
    limit 5
  `),
)

console.log('\nOrganização:')
console.table(
  await q(`
    select mrr, arr, project_monthly_cost, operating_monthly_cost, total_monthly_cost,
           gross_profit, gross_margin, net_profit, net_margin, active_projects, active_customers
    from public.organization_economics_at(current_date)
    where organization_id = md5('org:iacentrism')::uuid
  `),
)

console.log('\nCusto por categoria:')
console.table(
  await q(`
    select category, scope, entries, monthly_amount
    from public.v_cost_by_category
    order by monthly_amount desc
    limit 8
  `),
)

console.log('\nProjeto mais caro do cliente Alpha:')
console.table(
  await q(`
    select project_name, monthly_revenue, monthly_cost, monthly_profit, margin
    from public.project_economics_at(current_date)
    where company_name = 'Alpha Imóveis'
    order by monthly_cost desc
  `),
)

await db.close()
