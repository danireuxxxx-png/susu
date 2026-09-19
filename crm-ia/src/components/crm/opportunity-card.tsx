import { CalendarClock, Flame, User } from 'lucide-react'
import { PriorityBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatFriendlyDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Opportunity } from '@/types'

interface OpportunityCardProps {
  opportunity: Opportunity
  onOpen?: (opportunity: Opportunity) => void
  dragging?: boolean
  className?: string
}

export function OpportunityCard({ opportunity, onOpen, dragging, className }: OpportunityCardProps) {
  return (
    <article
      onClick={onOpen ? () => onOpen(opportunity) : undefined}
      className={cn(
        'rounded-xl border border-line bg-surface p-3 shadow-elevated-sm',
        'transition-[border-color,box-shadow,transform] duration-150',
        onOpen && 'cursor-pointer hover:border-line-strong hover:shadow-elevated-md',
        dragging && 'rotate-[1.5deg] shadow-elevated-lg',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] font-semibold text-fg">{opportunity.companyName}</p>
        {opportunity.priority === 'alta' ? (
          <Flame className="size-3.5 shrink-0 text-critical" aria-label="Prioridade alta" />
        ) : null}
      </div>

      <p className="mt-1.5 text-[15px] font-semibold tracking-tight text-fg tabular">
        {formatCurrency(opportunity.value)}
      </p>
      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-fg-muted">{opportunity.title}</p>

      <div className="mt-2.5 space-y-1 text-[11px] text-fg-subtle">
        <p className="flex items-center gap-1.5">
          <User className="size-3" aria-hidden />
          <span className="truncate">{opportunity.contactName}</span>
        </p>
        {opportunity.nextActionAt ? (
          <p className="flex items-center gap-1.5">
            <CalendarClock className="size-3" aria-hidden />
            <span className="truncate">{formatFriendlyDateTime(opportunity.nextActionAt)}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <PriorityBadge priority={opportunity.priority} size="sm" />
        <span className="text-[11px] text-fg-subtle tabular">{opportunity.probability}%</span>
      </div>
    </article>
  )
}
