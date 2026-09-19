import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_SPEC, type RevenueRange } from '@/constants/charts'
import { useChartTheme } from '@/hooks/use-theme'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import type { DailyRevenuePoint } from '@/mock/finance'
import type { MonthlyFinance } from '@/types'
import { ChartTooltip, type ChartTooltipProps } from './chart-tooltip'

interface RevenueChartProps {
  daily: DailyRevenuePoint[]
  monthly: MonthlyFinance[]
  range: RevenueRange
  height?: number
}

/** Serie unica: sem legenda (o titulo do card ja diz o que esta plotado). */
export function RevenueChart({ daily, monthly, range, height = 260 }: RevenueChartProps) {
  const theme = useChartTheme()

  const data = useMemo(() => {
    if (range === '12m') {
      return monthly.map((month) => ({ label: month.label, value: month.revenue }))
    }
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    return daily.slice(-days).map((point) => ({ label: point.label, value: point.revenue }))
  }, [daily, monthly, range])

  const interval = range === '90d' ? 10 : range === '30d' ? 4 : 0

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.series[0]} stopOpacity={CHART_SPEC.areaOpacity} />
            <stop offset="100%" stopColor={theme.series[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: theme.grid }}
          tick={{ fill: theme.textMuted, fontSize: 12 }}
          interval={interval}
          minTickGap={12}
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
          cursor={{ stroke: theme.axis, strokeWidth: 1 }}
          content={(props: unknown) => (
            <ChartTooltip {...(props as ChartTooltipProps)} formatValue={(value) => formatCurrency(value)} />
          )}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="Receita"
          stroke={theme.series[0]}
          strokeWidth={CHART_SPEC.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#revenue-fill)"
          activeDot={{
            r: CHART_SPEC.activeDotRadius,
            fill: theme.series[0],
            stroke: theme.surface,
            strokeWidth: 2,
          }}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
