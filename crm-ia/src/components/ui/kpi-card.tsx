import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Delta } from './delta'
import { Sparkline } from './sparkline'
import { Tooltip } from './tooltip'
import { Info } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: ReactNode
  delta?: number | null
  deltaSuffix?: string
  deltaUnit?: 'percent' | 'points'
  invertDelta?: boolean
  icon?: LucideIcon
  hint?: string
  trend?: number[]
  footer?: ReactNode
  className?: string
}

export function KpiCard({
  label,
  value,
  delta,
  deltaSuffix = 'vs. mês anterior',
  deltaUnit = 'percent',
  invertDelta = false,
  icon: Icon,
  hint,
  trend,
  footer,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'group rounded-card border border-line bg-surface p-4 shadow-elevated-sm',
        'transition-colors duration-150 hover:border-line-strong',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-medium text-fg-muted">{label}</p>
          {hint ? (
            <Tooltip content={hint}>
              <button type="button" aria-label={`Sobre ${label}`} className="text-fg-subtle transition-colors hover:text-fg-muted">
                <Info className="size-3.5" aria-hidden />
              </button>
            </Tooltip>
          ) : null}
        </div>
        {Icon ? (
          <span className="grid size-7 place-items-center rounded-lg bg-surface-inset text-fg-subtle transition-colors group-hover:text-fg-muted">
            <Icon className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight text-fg">{value}</p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {delta !== undefined ? (
            <Delta value={delta} invert={invertDelta} unit={deltaUnit} suffix={deltaSuffix} />
          ) : null}
          {footer ? <div className="mt-1 text-[13px] text-fg-subtle">{footer}</div> : null}
        </div>
        {trend?.length ? <Sparkline points={trend} /> : null}
      </div>
    </div>
  )
}
