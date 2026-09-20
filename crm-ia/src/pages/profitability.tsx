import { AlertTriangle, CircleDollarSign, Percent, PiggyBank, Receipt, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CostBreakdownChart } from '@/components/charts/cost-breakdown-chart'
import { MarginIndicator } from '@/components/crm/margin-indicator'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { ChartCard } from '@/components/ui/chart-card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader, SectionTitle } from '@/components/ui/page-header'
import { Segmented } from '@/components/ui/segmented'
import { MARGIN_ALERT_THRESHOLD } from '@/constants/costs'
import { useAsync } from '@/hooks/use-async'
import { formatCurrency, formatPercent } from '@/lib/format'
import { economicsService } from '@/services/economics.service'
import type { CustomerProfitability } from '@/types'

type OrderBy = 'profit' | 'revenue' | 'cost' | 'margin'

const ORDER_OPTIONS = [
  { value: 'profit' as const, label: 'Lucro' },
  { value: 'revenue' as const, label: 'Receita' },
  { value: 'cost' as const, label: 'Custo' },
  { value: 'margin' as const, label: 'Margem' },
]

/**
 * Rentabilidade da carteira.
 *
 * Junta as três respostas que o dono do negócio precisa: quanto cada
 * cliente paga, quanto custa mantê-lo e para onde vai o dinheiro da
 * operação.
 */
export function ProfitabilityPage() {
  const navigate = useNavigate()
  const [orderBy, setOrderBy] = useState<OrderBy>('profit')

  const { data: operation, loading: loadingOperation } = useAsync(() => economicsService.operation())
  const { data: customers, loading: loadingCustomers } = useAsync(
    () => economicsService.listCustomerProfitability(orderBy, 'desc'),
    [orderBy],
  )
  const { data: breakdown, loading: loadingBreakdown } = useAsync(() => economicsService.costBreakdown())

  const rows = useMemo(() => customers ?? [], [customers])

  const atRisk = useMemo(
    () => rows.filter((row) => row.monthlyRevenue > 0 && row.margin < MARGIN_ALERT_THRESHOLD),
    [rows],
  )

  const columns: Column<CustomerProfitability>[] = [
    {
      id: 'cliente',
      header: 'Cliente',
      sortValue: (row) => row.companyName,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{row.companyName}</p>
          <p className="truncate text-[12px] text-fg-muted">
            {row.projectsActive} de {row.projectsTotal} projeto(s) ativo(s)
          </p>
        </div>
      ),
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
    {
      id: 'anual',
      header: 'Lucro anual',
      align: 'right',
      hideBelow: 'lg',
      sortValue: (row) => row.annualProfit,
      cell: (row) => <span className="text-[13px] text-fg-muted">{formatCurrency(row.annualProfit)}</span>,
    },
  ]

  if (loadingOperation && loadingCustomers) return <PageSkeleton />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rentabilidade"
        description="Quanto cada cliente paga, quanto custa mantê-lo e quanto sobra de verdade."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Receita recorrente"
          value={formatCurrency(operation?.mrr ?? 0)}
          icon={CircleDollarSign}
          footer={`${formatCurrency(operation?.arr ?? 0)} projetados para 12 meses`}
        />
        <KpiCard
          label="Custo dos projetos"
          value={formatCurrency(operation?.projectCost ?? 0)}
          icon={Receipt}
          footer={`Operação: ${formatCurrency(operation?.operatingCost ?? 0)}`}
        />
        <KpiCard
          label="Lucro bruto"
          value={formatCurrency(operation?.grossProfit ?? 0)}
          icon={PiggyBank}
          footer={`Margem bruta de ${formatPercent(operation?.grossMargin ?? 0)}`}
        />
        <KpiCard
          label="Lucro líquido"
          value={formatCurrency(operation?.netProfit ?? 0)}
          icon={Percent}
          footer={`Depois da operação · margem ${formatPercent(operation?.netMargin ?? 0)}`}
        />
      </section>

      {atRisk.length ? (
        <div className="flex items-start gap-3 rounded-card border border-line bg-serious-soft px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-serious" aria-hidden />
          <div className="text-[13px] leading-relaxed text-fg">
            <strong className="font-medium">
              {atRisk.length} cliente(s) com margem abaixo de {MARGIN_ALERT_THRESHOLD}%:
            </strong>{' '}
            {atRisk
              .slice(0, 3)
              .map((row) => `${row.companyName} (${formatPercent(row.margin)})`)
              .join(' · ')}
            {atRisk.length > 3 ? ` e mais ${atRisk.length - 3}.` : '.'}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <SectionTitle
          title="Rentabilidade por cliente"
          description="A ordenação é feita no banco, sobre o cálculo oficial."
          action={
            <Segmented
              ariaLabel="Ordenar rentabilidade"
              options={ORDER_OPTIONS}
              value={orderBy}
              onChange={setOrderBy}
              size="sm"
            />
          }
        />

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.companyId}
          onRowClick={(row) => navigate(`/empresas/${row.companyId}`)}
          loading={loadingCustomers}
          emptyIcon={Users}
          emptyTitle="Nenhum cliente com projeto"
          emptyDescription="A rentabilidade aparece quando uma venda vira projeto."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Custo por categoria"
          description="Quanto vai para APIs de IA, infraestrutura e equipe."
          footer="Inclui custos de projeto e da operação, na mesma base mensal."
        >
          {loadingBreakdown ? (
            <div className="h-[260px]" />
          ) : (
            <CostBreakdownChart rows={breakdown?.byCategory ?? []} />
          )}
        </ChartCard>

        <ChartCard
          title="Custo por fornecedor"
          description="Quanto cada provedor consome por mês."
          footer="Hoje os valores são cadastrados manualmente; a importação automática é o próximo passo."
        >
          {loadingBreakdown ? (
            <div className="h-[260px]" />
          ) : (
            <CostBreakdownChart rows={breakdown?.byProvider ?? []} />
          )}
        </ChartCard>
      </div>
    </div>
  )
}
