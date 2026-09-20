import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_SPEC } from '@/constants/charts'
import { useChartTheme } from '@/hooks/use-theme'
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format'
import { ratio } from '@/lib/utils'
import type { CostBreakdownRow } from '@/types'
import { ChartTooltip, type ChartTooltipProps } from './chart-tooltip'

interface CostBreakdownChartProps {
  rows: CostBreakdownRow[]
  height?: number
  limit?: number
}

/**
 * Onde o dinheiro vai.
 *
 * Categorias e fornecedores são nominais: uma cor só para todas as
 * barras, com o valor rotulado na ponta — a barra já mostra a ordem.
 */
export function CostBreakdownChart({ rows, height = 260, limit = 8 }: CostBreakdownChartProps) {
  const theme = useChartTheme()
  const data = rows.slice(0, limit)
  const total = rows.reduce((sum, row) => sum + row.monthlyAmount, 0)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 88, bottom: 4, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={132}
          tick={{ fill: theme.textMuted, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: theme.grid, fillOpacity: 0.6 }}
          content={(props: unknown) => (
            <ChartTooltip
              {...(props as ChartTooltipProps)}
              formatValue={(value) => formatCurrency(value)}
              footer={(payload) =>
                `${formatPercent(ratio(Number(payload.monthlyAmount ?? 0), total) * 100)} do custo · ${
                  payload.entries ?? 0
                } lançamento(s)`
              }
            />
          )}
        />
        <Bar
          dataKey="monthlyAmount"
          name="Custo mensal"
          fill={theme.series[0]}
          barSize={CHART_SPEC.barSize}
          radius={[0, 4, 4, 0]}
        >
          <LabelList
            dataKey="monthlyAmount"
            position="right"
            offset={8}
            fill={theme.textMuted}
            fontSize={12}
            formatter={(value: unknown) => formatCompactCurrency(Number(value ?? 0))}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
