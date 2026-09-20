import { Boxes, CircleDollarSign, Percent, Receipt, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilterBar, FilterSelect } from '@/components/crm/filter-bar'
import { MarginIndicator } from '@/components/crm/margin-indicator'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { MARGIN_ALERT_THRESHOLD, PROJECT_STATUSES, PROJECT_STATUS_BY_ID } from '@/constants/costs'
import { useAsync } from '@/hooks/use-async'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { formatCurrency, formatPercent } from '@/lib/format'
import { matches, ratio, sum } from '@/lib/utils'
import { economicsService } from '@/services/economics.service'
import type { ProjectEconomics } from '@/types'

/**
 * Projetos entregues, com o que cada um dá de lucro.
 *
 * É a unidade de rentabilidade do negócio: uma venda vira um projeto, e é
 * no projeto que receita e custo se encontram.
 */
export function ProjectsPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useAsync(() => economicsService.listProjects())
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  const [status, setStatus] = useState('todos')

  const projects = useMemo(() => data ?? [], [data])

  const filtered = useMemo(
    () =>
      projects.filter((project) => {
        if (status !== 'todos' && project.status !== status) return false
        return matches([project.name, project.companyName], debouncedQuery)
      }),
    [projects, status, debouncedQuery],
  )

  const totals = useMemo(() => {
    const revenue = sum(projects, (project) => project.monthlyRevenue)
    const cost = sum(projects, (project) => project.monthlyCost)
    return {
      revenue,
      cost,
      profit: revenue - cost,
      margin: ratio(revenue - cost, revenue) * 100,
      active: projects.filter((project) => project.status === 'ativo').length,
      atRisk: projects.filter(
        (project) => project.monthlyRevenue > 0 && project.margin < MARGIN_ALERT_THRESHOLD,
      ).length,
    }
  }, [projects])

  const columns: Column<ProjectEconomics>[] = [
    {
      id: 'projeto',
      header: 'Projeto',
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{row.name}</p>
          <p className="truncate text-[12px] text-fg-muted">{row.companyName}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => {
        const descriptor = PROJECT_STATUS_BY_ID[row.status]
        return (
          <Badge tone={descriptor?.tone ?? 'neutro'} size="sm" dot>
            {descriptor?.label ?? row.status}
          </Badge>
        )
      },
    },
    {
      id: 'receita',
      header: 'Receita',
      align: 'right',
      sortValue: (row) => row.monthlyRevenue,
      cell: (row) => formatCurrency(row.monthlyRevenue),
    },
    {
      id: 'custo',
      header: 'Custo',
      align: 'right',
      sortValue: (row) => row.monthlyCost,
      cell: (row) => formatCurrency(row.monthlyCost),
    },
    {
      id: 'lucro',
      header: 'Lucro',
      align: 'right',
      sortValue: (row) => row.monthlyProfit,
      cell: (row) => (
        <span className={row.monthlyProfit < 0 ? 'font-medium text-critical' : 'font-medium text-fg'}>
          {formatCurrency(row.monthlyProfit)}
        </span>
      ),
    },
    {
      id: 'margem',
      header: 'Margem',
      align: 'right',
      sortValue: (row) => row.margin,
      cell: (row) => <MarginIndicator value={row.margin} revenue={row.monthlyRevenue} />,
    },
  ]

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projetos"
        description="O que foi vendido, o que custa manter e quanto sobra em cada entrega."
      />

      {error ? (
        <p className="rounded-card border border-line bg-critical-soft px-4 py-3 text-[13px] text-critical">
          {error}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Receita dos projetos"
          value={formatCurrency(totals.revenue)}
          icon={CircleDollarSign}
          footer={`${totals.active} projetos ativos`}
        />
        <KpiCard
          label="Custo mensal"
          value={formatCurrency(totals.cost)}
          icon={Receipt}
          footer="Soma das linhas de custo vigentes"
        />
        <KpiCard
          label="Lucro mensal"
          value={formatCurrency(totals.profit)}
          icon={TrendingUp}
          footer="Receita menos custo direto"
        />
        <KpiCard
          label="Margem média"
          value={formatPercent(totals.margin)}
          icon={Percent}
          footer={
            totals.atRisk
              ? `${totals.atRisk} projeto(s) abaixo de ${MARGIN_ALERT_THRESHOLD}%`
              : 'Nenhum projeto abaixo do alerta'
          }
        />
      </section>

      <FilterBar
        activeCount={status === 'todos' ? 0 : 1}
        onClear={() => {
          setStatus('todos')
          setQuery('')
        }}
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar projeto ou cliente"
          className="w-full sm:w-72"
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={PROJECT_STATUSES.map((item) => ({ value: item.id, label: item.label }))}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/projetos/${row.id}`)}
        emptyIcon={Boxes}
        emptyTitle="Nenhum projeto encontrado"
        emptyDescription="Projetos nascem de uma oportunidade ganha."
        initialSort={{ columnId: 'lucro', direction: 'desc' }}
      />
    </div>
  )
}
