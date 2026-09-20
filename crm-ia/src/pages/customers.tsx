import { CircleDollarSign, HeartPulse, TrendingUp, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilterBar, FilterSelect } from '@/components/crm/filter-bar'
import { CustomerCard } from '@/components/crm/customer-card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import { ProgressBar } from '@/components/ui/progress'
import { toneForProgress } from '@/lib/tone'
import { SearchInput } from '@/components/ui/search-input'
import { Segmented } from '@/components/ui/segmented'
import { CustomerStatusBadge } from '@/components/ui/status-badge'
import { CUSTOMER_STATUSES } from '@/constants/labels'
import { useCrmData } from '@/hooks/use-crm'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { formatCurrency, formatDate, formatRelative } from '@/lib/format'
import { activeCustomers, arr, mrr } from '@/lib/metrics'
import { matches } from '@/lib/utils'
import type { Customer } from '@/types'

export function CustomersPage() {
  const { customers, team } = useCrmData()
  const navigate = useNavigate()
  const [view, setView] = useState<'cards' | 'tabela'>('cards')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  const [status, setStatus] = useState('todos')
  const [owner, setOwner] = useState('todos')

  const filtered = useMemo(
    () =>
      customers.filter((customer) => {
        if (status !== 'todos' && customer.status !== status) return false
        if (owner !== 'todos' && customer.ownerId !== owner) return false
        return matches([customer.companyName, customer.primaryContact, customer.plan], debouncedQuery)
      }),
    [customers, status, owner, debouncedQuery],
  )

  const summary = useMemo(() => {
    const active = activeCustomers(customers)
    const atRisk = customers.filter((customer) => customer.status === 'risco' || customer.status === 'churn')
    return {
      mrr: mrr(customers),
      arr: arr(customers),
      active: active.length,
      averageMrr: active.length ? mrr(customers) / active.length : 0,
      atRisk: atRisk.length,
      averageHealth: active.length
        ? active.reduce((total, customer) => total + customer.healthScore, 0) / active.length
        : 0,
    }
  }, [customers])

  const columns: Column<Customer>[] = [
    {
      id: 'empresa',
      header: 'Empresa',
      sortValue: (row) => row.companyName,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{row.companyName}</p>
          <p className="truncate text-[12px] text-fg-muted">{row.primaryContact}</p>
        </div>
      ),
    },
    { id: 'plano', header: 'Plano', hideBelow: 'md', cell: (row) => row.plan },
    {
      id: 'mrr',
      header: 'MRR',
      align: 'right',
      sortValue: (row) => row.mrr,
      cell: (row) => <span className="font-medium">{formatCurrency(row.mrr)}</span>,
    },
    {
      id: 'ltv',
      header: 'LTV',
      align: 'right',
      hideBelow: 'md',
      sortValue: (row) => row.ltv,
      cell: (row) => formatCurrency(row.ltv),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <CustomerStatusBadge status={row.status} size="sm" />,
    },
    {
      id: 'saude',
      header: 'Saúde',
      hideBelow: 'lg',
      sortValue: (row) => row.healthScore,
      cell: (row) => (
        <div className="flex w-24 items-center gap-2">
          <ProgressBar
            value={row.healthScore}
            tone={toneForProgress(row.healthScore)}
            size="sm"
            label={`Saúde de ${row.companyName}`}
          />
          <span className="text-[12px] text-fg-muted tabular">{row.healthScore}</span>
        </div>
      ),
    },
    {
      id: 'entrada',
      header: 'Cliente desde',
      hideBelow: 'xl',
      sortValue: (row) => row.startedAt,
      cell: (row) => <span className="text-[13px] text-fg-muted">{formatDate(row.startedAt)}</span>,
    },
    {
      id: 'interacao',
      header: 'Última interação',
      hideBelow: 'lg',
      sortValue: (row) => row.lastInteractionAt,
      cell: (row) => <span className="text-[13px] text-fg-muted">{formatRelative(row.lastInteractionAt)}</span>,
    },
    {
      id: 'renovacao',
      header: 'Renovação',
      hideBelow: 'xl',
      sortValue: (row) => row.renewalAt,
      cell: (row) => <span className="text-[13px] text-fg-muted">{formatDate(row.renewalAt)}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        description="A carteira ativa, a receita recorrente e quem precisa de atenção."
        actions={
          <Segmented
            ariaLabel="Visualização de clientes"
            options={[
              { value: 'cards' as const, label: 'Cards' },
              { value: 'tabela' as const, label: 'Tabela' },
            ]}
            value={view}
            onChange={setView}
          />
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="MRR" value={formatCurrency(summary.mrr)} icon={CircleDollarSign} footer="Receita recorrente mensal" />
        <KpiCard label="ARR" value={formatCurrency(summary.arr)} icon={TrendingUp} footer="Projeção anual da carteira" />
        <KpiCard label="Clientes ativos" value={String(summary.active)} icon={Users} footer={`MRR médio de ${formatCurrency(summary.averageMrr)}`} />
        <KpiCard
          label="Contas em risco"
          value={String(summary.atRisk)}
          icon={HeartPulse}
          footer={`Saúde média da carteira: ${Math.round(summary.averageHealth)}%`}
        />
      </section>

      <FilterBar
        activeCount={[status, owner].filter((value) => value !== 'todos').length}
        onClear={() => {
          setStatus('todos')
          setOwner('todos')
          setQuery('')
        }}
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar cliente, contato ou plano"
          className="w-full sm:w-72"
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={CUSTOMER_STATUSES.map((item) => ({ value: item.id, label: item.label }))}
        />
        <FilterSelect
          label="Responsável"
          value={owner}
          onChange={setOwner}
          options={team.map((member) => ({ value: member.id, label: member.name }))}
        />
      </FilterBar>

      {view === 'cards' ? (
        filtered.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-line bg-surface">
            <EmptyState
              icon={Users}
              title="Nenhum cliente encontrado"
              description="Ajuste os filtros para ver outras contas da carteira."
            />
          </div>
        )
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/empresas/${row.companyId}`)}
          emptyIcon={Users}
          emptyTitle="Nenhum cliente encontrado"
          emptyDescription="Ajuste os filtros para ver outras contas da carteira."
          initialSort={{ columnId: 'mrr', direction: 'desc' }}
        />
      )}
    </div>
  )
}
