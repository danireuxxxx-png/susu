import { Clock, Target, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ui/progress'
import { TemperatureBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ClientIntelligence as ClientIntelligenceData } from '@/types'
import { AiBadge } from './ai-insight-card'

interface ClientIntelligenceProps {
  data: ClientIntelligenceData
  contactName: string
  contactRole: string
  companyName: string
  className?: string
}

/**
 * Perfil inteligente do cliente: hoje mockado, amanha alimentado pelo agente
 * de WhatsApp a partir das conversas reais.
 */
export function ClientIntelligence({
  data,
  contactName,
  contactRole,
  companyName,
  className,
}: ClientIntelligenceProps) {
  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-fg">{contactName}</p>
          <p className="text-[13px] text-fg-muted">
            {contactRole} · {companyName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TemperatureBadge temperature={data.temperature} />
          <AiBadge />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoTile
          icon={Wallet}
          label="Orçamento estimado"
          value={`${formatCurrency(data.budgetMin)} — ${formatCurrency(data.budgetMax)}`}
        />
        <InfoTile icon={Clock} label="Prazo" value={`${data.deadlineDays} dias`} />
        <InfoTile icon={Target} label="Interesse" value={data.interest} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <ListBlock title="Necessidades identificadas" items={data.needs} />
        <ListBlock title="Principais dores" items={data.painPoints} />
      </div>

      <div className="rounded-xl border border-line bg-surface-muted p-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-medium text-fg">Confiança da extração</p>
          <span className="text-[13px] font-semibold text-fg tabular">{data.confidence}%</span>
        </div>
        <ProgressBar value={data.confidence} className="mt-2" label="Confiança da extração" />
        <p className="mt-2 text-[11px] text-fg-subtle">
          Dados atualizados automaticamente pela IA · {formatRelative(data.lastSyncedAt)}
        </p>
      </div>
    </div>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-fg-subtle">
        <Icon className="size-3" aria-hidden />
        {label}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-fg">{value}</p>
    </div>
  )
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-fg">{title}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item}>
            <Badge tone="neutro">{item}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
