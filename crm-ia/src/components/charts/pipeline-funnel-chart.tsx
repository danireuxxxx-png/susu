import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_SPEC } from '@/constants/charts'
import { useChartTheme } from '@/hooks/use-theme'
import { formatCompactCurrency, formatCurrency, formatNumber } from '@/lib/format'
import type { StageSummary } from '@/lib/metrics'
import { ChartTooltip, type ChartTooltipProps } from './chart-tooltip'

interface PipelineFunnelChartProps {
  stages: StageSummary[]
  height?: number
}

/**
 * Etapas sao categorias ORDENADAS, entao aqui a rampa ordinal de um unico
 * matiz e legitima: a cor reforca a ordem do funil, nao inventa identidade.
 */
export function PipelineFunnelChart({ stages, height = 280 }: PipelineFunnelChartProps) {
  const theme = useChartTheme()
  const data = stages.map((stage) => ({ ...stage, name: stage.shortLabel }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 82, bottom: 4, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={96}
          tick={{ fill: theme.textMuted, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: theme.grid, fillOpacity: 0.6 }}
          content={(props: unknown) => (
            <ChartTooltip
              {...(props as ChartTooltipProps)}
              formatValue={(value) => formatCurrency(value)}
              footer={(payload) => `${formatNumber(Number(payload.count ?? 0))} oportunidades nesta etapa`}
            />
          )}
        />
        <Bar dataKey="value" name="Valor em aberto" barSize={CHART_SPEC.barSize} radius={[0, 4, 4, 0]}>
          {data.map((stage, index) => (
            <Cell key={stage.id} fill={theme.ordinal[index % theme.ordinal.length]} />
          ))}
          <LabelList
            dataKey="value"
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
