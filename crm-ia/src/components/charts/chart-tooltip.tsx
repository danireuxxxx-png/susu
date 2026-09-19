import type { ReactNode } from 'react'
import { useChartTheme } from '@/hooks/use-theme'

export interface TooltipEntry {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

export interface ChartTooltipProps {
  active?: boolean
  label?: string | number
  payload?: TooltipEntry[]
  formatValue?: (value: number) => string
  formatLabel?: (label: string | number, payload?: Record<string, unknown>) => string
  footer?: (payload: Record<string, unknown>) => ReactNode
}

/**
 * Tooltip unico de todos os graficos: rotulo, uma linha por serie com o ponto
 * colorido na frente e o valor em texto neutro (cor de serie fica na marca,
 * nunca no texto).
 */
export function ChartTooltip({
  active,
  label,
  payload,
  formatValue,
  formatLabel,
  footer,
}: ChartTooltipProps) {
  const theme = useChartTheme()
  if (!active || !payload?.length) return null

  const raw = payload[0]?.payload ?? {}
  const heading = formatLabel ? formatLabel(label ?? '', raw) : String(label ?? '')

  return (
    <div
      className="min-w-40 rounded-lg border border-line bg-surface px-3 py-2"
      style={{ boxShadow: theme.tooltipShadow }}
    >
      {heading ? <p className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">{heading}</p> : null}
      <ul className="mt-1.5 space-y-1">
        {payload.map((entry, index) => (
          <li key={`${entry.dataKey ?? index}`} className="flex items-center justify-between gap-4 text-[13px]">
            <span className="flex items-center gap-2 text-fg-muted">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
              {entry.name}
            </span>
            <span className="font-medium tabular text-fg">
              {typeof entry.value === 'number' && formatValue ? formatValue(entry.value) : entry.value}
            </span>
          </li>
        ))}
      </ul>
      {footer ? <div className="mt-2 border-t border-line pt-1.5 text-[12px] text-fg-muted">{footer(raw)}</div> : null}
    </div>
  )
}

/** Legenda propria: identidade pelo ponto colorido, texto em tom neutro. */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-[12px] text-fg-muted">
          <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
