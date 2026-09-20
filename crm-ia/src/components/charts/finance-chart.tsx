import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_SPEC } from '@/constants/charts'
import { useChartTheme } from '@/hooks/use-theme'
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format'
import { ratio } from '@/lib/utils'
import type { MonthlyFinance } from '@/types'
import { ChartLegend, ChartTooltip, type ChartTooltipProps } from './chart-tooltip'

interface FinanceChartProps {
  months: MonthlyFinance[]
  height?: number
}

/**
 * Custo e lucro empilhados somam exatamente a receita do mes — a coluna
 * inteira E a receita, entao nada e inventado no empilhamento. O fio na cor
 * da superficie e o respiro de 2px entre os segmentos.
 */
export function FinanceChart({ months, height = 300 }: FinanceChartProps) {
  const theme = useChartTheme()
  const data = months.map((month) => ({ ...month, profit: month.revenue - month.cost }))

  return (
    <div className="space-y-3">
      <ChartLegend
        items={[
          { label: 'Custo', color: theme.series[1]! },
          { label: 'Lucro', color: theme.series[2]! },
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: theme.grid }}
            tick={{ fill: theme.textMuted, fontSize: 12 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={86}
            tick={{ fill: theme.textMuted, fontSize: 12 }}
            tickFormatter={(value: number) => formatCompactCurrency(value)}
          />
          <Tooltip
            cursor={{ fill: theme.grid, fillOpacity: 0.6 }}
            content={(props: unknown) => (
              <ChartTooltip
                {...(props as ChartTooltipProps)}
                formatValue={(value) => formatCurrency(value)}
                footer={(payload) =>
                  `Receita ${formatCurrency(Number(payload.revenue ?? 0))} · margem ${formatPercent(
                    ratio(Number(payload.profit ?? 0), Number(payload.revenue ?? 0)) * 100,
                  )}`
                }
              />
            )}
          />
          <Bar
            dataKey="cost"
            name="Custo"
            stackId="resultado"
            fill={theme.series[1]}
            barSize={CHART_SPEC.barSize}
            stroke={theme.surface}
            strokeWidth={CHART_SPEC.stackGap}
          />
          <Bar
            dataKey="profit"
            name="Lucro"
            stackId="resultado"
            fill={theme.series[2]}
            barSize={CHART_SPEC.barSize}
            radius={[4, 4, 0, 0]}
            stroke={theme.surface}
            strokeWidth={CHART_SPEC.stackGap}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
