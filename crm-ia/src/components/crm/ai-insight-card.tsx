import { Lightbulb, Sparkles, TrendingUp, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type InsightTone = 'positivo' | 'atencao' | 'neutro'

const TONE = {
  positivo: { icon: TrendingUp, className: 'text-good', ring: 'bg-good-soft' },
  atencao: { icon: TriangleAlert, className: 'text-serious', ring: 'bg-serious-soft' },
  neutro: { icon: Lightbulb, className: 'text-accent', ring: 'bg-accent-soft' },
} as const

export function AiInsightCard({
  text,
  tone = 'neutro',
  action,
  className,
}: {
  text: ReactNode
  tone?: InsightTone
  action?: ReactNode
  className?: string
}) {
  const { icon: Icon, className: iconColor, ring } = TONE[tone]

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5',
        'transition-colors duration-150 hover:border-line-strong',
        className,
      )}
    >
      <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', ring)}>
        <Icon className={cn('size-3.5', iconColor)} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-relaxed text-fg">{text}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  )
}

/** Selo usado sempre que um dado foi preenchido por IA, nunca por uma pessoa. */
export function AiBadge({ label = 'Atualizado pela IA', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-soft-fg',
        className,
      )}
    >
      <Sparkles className="size-3" aria-hidden />
      {label}
    </span>
  )
}
