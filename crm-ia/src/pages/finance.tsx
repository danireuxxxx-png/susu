import { CircleDollarSign, Percent, PiggyBank, Receipt, Repeat, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FinanceChart } from '@/components/charts/finance-chart'
import { ChartCard } from '@/components/ui/chart-card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import { Segmented } from '@/components/ui/segmented'
import { useCrmData } from '@/hooks/use-crm'
import { formatCurrency, formatPercent } from '@/lib/format'
import { arr, deltaBetween, mrr } from '@/lib/metrics'
import { ratio } from '@/lib/utils'
import type { CustomerFinance } from '@/types'

type Period = 'mes' | 'trimestre' | 'ano'

const PERIOD_OPTIONS = [
  { value: 'mes' as const, label: 'Mês' },
  { value: 'trimestre' as const, label: 'Trimestre' },
  { value: 'ano' as const, label: 'Ano' },
]

const MONTHS_BY_PERIOD: Record<Period, number> = { mes: 1, trimestre: 3, ano: 12 }

export function FinancePage() {
  const { finance, customers } = useCrmData()
  const [period, setPeriod] = useState<Period>('mes')

  const summary = useMemo(() => {
    const window = MONTHS_BY_PERIOD[period]
    const current = finance.monthly.slice(-window)
    const previous = finance.monthly.slice(-window * 2, -window)

    const total = (months: typeof current) => ({
      revenue: months.reduce((sum, month) => sum + month.revenue, 0),
      cost: months.reduce((sum, month) => sum + month.cost, 0),
    })

    const currentTotals = total(current)
    const previousTotals = total(previous)
    const profit = currentTotals.revenue - currentTotals.cost
    const previousProfit = previousTotals.revenue - previousTotals.cost

    return {
      revenue: currentTotals.revenue,
      revenueDelta: deltaBetween(currentTotals.revenue, previousTotals.revenue),
      cost: currentTotals.cost,
      costDelta: deltaBetween(currentTotals.cost, previousTotals.cost),
      profit,
      profitDelta: deltaBetween(profit, previousProfit),
      margin: ratio(profit, currentTotals.revenue) * 100,
      previousMargin: ratio(previousProfit, previousTotals.revenue) * 100,
      months: current,
    }
  }, [finance, period])

  const rows = useMemo(
    () =>
      finance.byCustomer.map((item) => ({
        ...item,
        profit: item.revenue - item.cost,
        margin: ratio(item.revenue - item.cost, item.revenue) * 100,
      })),
    [finance],
  )

  type Row = CustomerFinance & { profit: number; margin: number }

  const columns: Column<Row>[] = [
    {
      id: 'cliente',
      header: 'Cliente',
      sortValue: (row) => row.companyName,
      cell: (row) => <span className="font-medium text-fg">{row.companyName}</span>,
    },
    {
      id: 'receita',
      header: 'Receita',
      align: 'right',
      sortValue: (row) => row.revenue,
      cell: (row) => formatCurrency(row.revenue),
    },
    {
      id: 'custo',
      header: 'Custo',
      align: 'right',
      sortValue: (row) => row.cost,
      cell: (row) => formatCurrency(row.cost),
    },
    {
      id: 'lucro',
      header: 'Lucro',
      align: 'right',
      sortValue: (row) => row.profit,
      cell: (row) => <span className="font-medium text-fg">{formatCurrency(row.profit)}</span>,
    },
    {
      id: 'margem',
      header: 'Margem',
      align: 'right',
      sortValue: (row) => row.margin,
      cell: (row) => (
        <span className={row.margin >= 60 ? 'text-good' : row.margin >= 40 ? 'text-fg' : 'text-serious'}>
          {formatPercent(row.margin)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Financeiro"
        description="Receita, custo e lucro da operação — recorrência e projetos no mesmo lugar."
        actions={
          <Segmented ariaLabel="Período financeiro" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Receita"
          value={formatCurrency(summary.revenue)}
          delta={summary.revenueDelta}
          deltaSuffix="vs. período anterior"
          icon={CircleDollarSign}
        />
        <KpiCard
          label="Custos"
          value={formatCurrency(summary.cost)}
          delta={summary.costDelta}
          deltaSuffix="vs. período anterior"
          invertDelta
          icon={Receipt}
        />
        <KpiCard
          label="Lucro"
          value={formatCurrency(summary.profit)}
          delta={summary.profitDelta}
          deltaSuffix="vs. período anterior"
          icon={PiggyBank}
        />
        <KpiCard
          label="Margem"
          value={formatPercent(summary.margin)}
          delta={summary.margin - summary.previousMargin}
          deltaUnit="points"
          deltaSuffix="vs. período anterior"
          icon={Percent}
        />
        <KpiCard label="MRR" value={formatCurrency(mrr(customers))} icon={Repeat} footer="Receita recorrente da carteira" />
        <KpiCard label="ARR" value={formatCurrency(arr(customers))} icon={TrendingUp} footer="MRR projetado para 12 meses" />
      </section>

      <ChartCard
        title="Receita, custo e lucro"
        description="Cada coluna é a receita do mês: o custo na base, o lucro no topo."
        footer="Mesma escala para as duas parcelas — a altura total da coluna é a receita reconhecida."
      >
        <FinanceChart months={finance.monthly} />
      </ChartCard>

      <div className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight text-fg">Resultado por cliente</h2>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.customerId}
          emptyIcon={CircleDollarSign}
          emptyTitle="Sem receita registrada"
          initialSort={{ columnId: 'receita', direction: 'desc' }}
        />
      </div>
    </div>
  )
}
