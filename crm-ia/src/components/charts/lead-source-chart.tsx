import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_SPEC } from '@/constants/charts'
import { useChartTheme } from '@/hooks/use-theme'
import { formatNumber, formatPercent } from '@/lib/format'
import { ratio } from '@/lib/utils'
import { ChartTooltip, type ChartTooltipProps } from './chart-tooltip'

interface LeadSourceChartProps {
  sources: { id: string; label: string; count: number }[]
  height?: number
}

/**
 * Origens sao categorias nominais: uma cor so para todas as barras e rotulo
 * direto na ponta (o valor fica legivel sem depender do eixo).
 */
export function LeadSourceChart({ sources, height = 240 }: LeadSourceChartProps) {
  const theme = useChartTheme()
  const total = sources.reduce((sum, source) => sum + source.count, 0)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sources} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={88}
          tick={{ fill: theme.textMuted, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: theme.grid, fillOpacity: 0.6 }}
          content={(props: unknown) => (
            <ChartTooltip
              {...(props as ChartTooltipProps)}
              formatValue={(value) => `${formatNumber(value)} leads`}
              footer={(payload) => `${formatPercent(ratio(Number(payload.count ?? 0), total) * 100)} do total`}
            />
          )}
        />
        <Bar
          dataKey="count"
          name="Leads"
          fill={theme.series[0]}
          barSize={CHART_SPEC.barSize}
          radius={[0, 4, 4, 0]}
        >
          <LabelList
            dataKey="count"
            position="right"
            offset={8}
            fill={theme.textMuted}
            fontSize={12}
            formatter={(value: unknown) => formatNumber(Number(value ?? 0))}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
