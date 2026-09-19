import { ArrowRight, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { COMPANY_SIZE_BY_ID } from '@/constants/labels'
import { formatCompactCurrency, formatNumber } from '@/lib/format'
import type { Company } from '@/types'

export function CompanyCard({ company, openCount }: { company: Company; openCount: number }) {
  const isCustomer = company.mrr > 0

  return (
    <Link
      to={`/empresas/${company.id}`}
      className="group flex flex-col rounded-card border border-line bg-surface p-4 shadow-elevated-sm transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-elevated-md"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">{company.tradeName}</h3>
          <p className="truncate text-[12px] text-fg-muted">{company.segment}</p>
        </div>
        <Badge tone={isCustomer ? 'positivo' : 'neutro'} size="sm" dot>
          {isCustomer ? 'Cliente' : 'Prospect'}
        </Badge>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-fg-subtle">MRR</dt>
          <dd className="mt-0.5 text-[13px] font-semibold text-fg tabular">
            {isCustomer ? formatCompactCurrency(company.mrr) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-fg-subtle">Total vendido</dt>
          <dd className="mt-0.5 text-[13px] font-semibold text-fg tabular">
            {company.totalSold ? formatCompactCurrency(company.totalSold) : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-fg-muted">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3" aria-hidden />
          {company.city}/{company.state}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3" aria-hidden />
          {formatNumber(company.employees)} colaboradores
        </span>
      </div>

      <footer className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="text-[12px] text-fg-muted">
          {COMPANY_SIZE_BY_ID[company.size].label}
          {openCount ? ` · ${openCount} em aberto` : ''}
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-accent">
          Abrir ficha
          <ArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </footer>
    </Link>
  )
}
