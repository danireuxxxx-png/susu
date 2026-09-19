import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Contact2,
  CornerDownLeft,
  Search,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALL_NAV_ITEMS } from '@/constants/navigation'
import { useCrm } from '@/hooks/use-crm'
import { formatCurrency } from '@/lib/format'
import { cn, matches } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  hint?: string
  group: string
  icon: LucideIcon
  href: string
  keywords: string[]
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_PER_GROUP = 4

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { data } = useCrm()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const commands = useMemo<CommandItem[]>(() => {
    const navigation: CommandItem[] = ALL_NAV_ITEMS.map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      group: 'Navegação',
      icon: item.icon,
      href: item.href,
      keywords: [item.label, item.href],
    }))

    if (!data) return navigation

    const opportunities: CommandItem[] = data.opportunities.map((item) => ({
      id: `opo-${item.id}`,
      label: item.companyName,
      hint: `${item.title} · ${formatCurrency(item.value)}`,
      group: 'Oportunidades',
      icon: Workflow,
      href: `/pipeline?oportunidade=${item.id}`,
      keywords: [item.companyName, item.title, item.contactName],
    }))

    const leads: CommandItem[] = data.leads.map((lead) => ({
      id: `lead-${lead.id}`,
      label: lead.name,
      hint: `${lead.companyName} · ${lead.role}`,
      group: 'Leads',
      icon: Contact2,
      href: `/leads?lead=${lead.id}`,
      keywords: [lead.name, lead.companyName, lead.email],
    }))

    const customers: CommandItem[] = data.customers.map((customer) => ({
      id: `cli-${customer.id}`,
      label: customer.companyName,
      hint: `Cliente ${customer.plan} · ${formatCurrency(customer.mrr)}/mês`,
      group: 'Clientes',
      icon: Users,
      href: `/clientes?cliente=${customer.id}`,
      keywords: [customer.companyName, customer.primaryContact, customer.plan],
    }))

    const companies: CommandItem[] = data.companies.map((company) => ({
      id: `emp-${company.id}`,
      label: company.tradeName,
      hint: `${company.segment} · ${company.city}/${company.state}`,
      group: 'Empresas',
      icon: Building2,
      href: `/empresas/${company.id}`,
      keywords: [company.tradeName, company.legalName, company.segment, company.city],
    }))

    const activities: CommandItem[] = data.activities.slice(0, 40).map((activity) => ({
      id: `atv-${activity.id}`,
      label: activity.title,
      hint: activity.companyName,
      group: 'Atividades',
      icon: CalendarCheck,
      href: '/atividades',
      keywords: [activity.title, activity.companyName],
    }))

    return [...navigation, ...opportunities, ...leads, ...customers, ...companies, ...activities]
  }, [data])

  const results = useMemo(() => {
    const filtered = commands.filter((item) => matches([item.label, item.hint, ...item.keywords], query))
    const grouped = new Map<string, CommandItem[]>()
    for (const item of filtered) {
      const list = grouped.get(item.group) ?? []
      if (list.length < MAX_PER_GROUP) {
        list.push(item)
        grouped.set(item.group, list)
      }
    }
    return [...grouped.entries()]
  }, [commands, query])

  const flat = useMemo(() => results.flatMap(([, items]) => items), [results])

  useEffect(() => setActiveIndex(0), [query])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % Math.max(flat.length, 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + flat.length) % Math.max(flat.length, 1))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const selected = flat[activeIndex]
      if (selected) {
        navigate(selected.href)
        onOpenChange(false)
      }
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] data-[state=open]:animate-fade-in dark:bg-black/60" />
        <DialogPrimitive.Content
          onKeyDown={handleKeyDown}
          className={cn(
            'fixed left-1/2 top-[12vh] z-50 w-[min(38rem,calc(100vw-2rem))] -translate-x-1/2',
            'overflow-hidden rounded-2xl border border-line bg-surface shadow-elevated-lg',
            'data-[state=open]:animate-slide-up focus:outline-none',
          )}
        >
          <DialogPrimitive.Title className="sr-only">Busca global</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Pesquise clientes, empresas, leads, oportunidades e atividades.
          </DialogPrimitive.Description>

          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar clientes, empresas, leads, oportunidades..."
              className="h-12 w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
            />
            <kbd className="hidden shrink-0 rounded border border-line bg-surface-inset px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle sm:block">
              ESC
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2 scrollbar-thin">
            {flat.length ? (
              results.map(([group, items]) => (
                <div key={group} className="mb-1 last:mb-0">
                  <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
                    {group}
                  </p>
                  {items.map((item) => {
                    const index = flat.indexOf(item)
                    const active = index === activeIndex
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          navigate(item.href)
                          onOpenChange(false)
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-100',
                          active ? 'bg-surface-hover' : 'hover:bg-surface-hover',
                        )}
                      >
                        <item.icon className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-fg">{item.label}</span>
                          {item.hint ? (
                            <span className="block truncate text-[12px] text-fg-subtle">{item.hint}</span>
                          ) : null}
                        </span>
                        {active ? (
                          <CornerDownLeft className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
                        ) : (
                          <ArrowRight className="size-3.5 shrink-0 text-transparent" aria-hidden />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            ) : (
              <p className="px-3 py-10 text-center text-[13px] text-fg-muted">
                Nenhum resultado para “{query}”.
              </p>
            )}
          </div>

          <footer className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-fg-subtle">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface-inset px-1">↑</kbd>
              <kbd className="rounded border border-line bg-surface-inset px-1">↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface-inset px-1">↵</kbd>
              abrir
            </span>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
