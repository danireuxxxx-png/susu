import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_SPEC } from '@/constants/charts'
import { useChartTheme } from '@/hooks/use-theme'
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format'
import { ratio } from '@/lib/utils'
import type { MonthlyFinance } from '@/types'
import { ChartLegend, ChartTooltip, type ChartTooltipProps } from './chart-tooltip'

interface RevenueGoalChartProps {
  months: MonthlyFinance[]
  height?: number
}

/**
 * Meta e referencia, nao identidade: fica em cinza neutro atras do realizado,
 * que carrega o matiz da serie. Mesmo eixo para as duas — nunca dois eixos.
 */
export function RevenueGoalChart({ months, height = 260 }: RevenueGoalChartProps) {
  const theme = useChartTheme()
  const data = months.slice(-6)

  return (
    <div className="space-y-3">
      <ChartLegend
        items={[
          { label: 'Meta', color: theme.reference },
          { label: 'Realizado', color: theme.series[0]! },
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
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
                  `Atingimento: ${formatPercent(
                    ratio(Number(payload.revenue ?? 0), Number(payload.goal ?? 0)) * 100,
                  )}`
                }
              />
            )}
          />
          <Bar dataKey="goal" name="Meta" fill={theme.reference} barSize={CHART_SPEC.barSize} radius={[4, 4, 0, 0]} />
          <Bar
            dataKey="revenue"
            name="Realizado"
            fill={theme.series[0]}
            barSize={CHART_SPEC.barSize}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
