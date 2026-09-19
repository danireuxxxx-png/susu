import { ArrowRight, CalendarClock, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ui/progress'
import { toneForProgress } from '@/lib/tone'
import { CustomerStatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate, formatRelative } from '@/lib/format'
import { memberName } from '@/mock/team'
import type { Customer } from '@/types'

export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <article className="flex flex-col rounded-card border border-line bg-surface p-4 shadow-elevated-sm transition-colors duration-150 hover:border-line-strong">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">{customer.companyName}</h3>
          <p className="truncate text-[12px] text-fg-muted">{customer.primaryContact}</p>
        </div>
        <CustomerStatusBadge status={customer.status} size="sm" />
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-fg-subtle">MRR</p>
          <p className="mt-0.5 text-[15px] font-semibold text-fg tabular">{formatCurrency(customer.mrr)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-fg-subtle">LTV</p>
          <p className="mt-0.5 text-[15px] font-semibold text-fg tabular">{formatCurrency(customer.ltv)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-fg-muted">Saúde da conta</span>
          <span className="font-medium text-fg tabular">{customer.healthScore}%</span>
        </div>
        <ProgressBar
          value={customer.healthScore}
          tone={toneForProgress(customer.healthScore)}
          size="sm"
          className="mt-1.5"
          label={`Saúde de ${customer.companyName}`}
        />
      </div>

      <dl className="mt-4 space-y-1.5 text-[12px]">
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1.5 text-fg-muted">
            <MessageSquare className="size-3" aria-hidden />
            Última interação
          </dt>
          <dd className="text-fg">{formatRelative(customer.lastInteractionAt)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1.5 text-fg-muted">
            <CalendarClock className="size-3" aria-hidden />
            Próxima renovação
          </dt>
          <dd className="text-fg">{formatDate(customer.renewalAt)}</dd>
        </div>
      </dl>

      <footer className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex items-center gap-2">
          <Badge tone="neutro" size="sm">
            {customer.plan}
          </Badge>
          <span className="text-[11px] text-fg-subtle">{memberName(customer.ownerId)}</span>
        </div>
        <Link
          to={`/empresas/${customer.companyId}`}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-accent transition-opacity hover:opacity-80"
        >
          Ver empresa
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </footer>
    </article>
  )
}
