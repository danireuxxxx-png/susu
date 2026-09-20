import { SlidersHorizontal, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  children: ReactNode
  /** Quantos filtros estao ativos — mostra o botao de limpar. */
  activeCount?: number
  onClear?: () => void
  className?: string
}

export function FilterBar({ children, activeCount = 0, onClear, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-3',
        className,
      )}
    >
      <span className="hidden items-center gap-1.5 pl-1 pr-1 text-[12px] font-medium text-fg-subtle sm:flex">
        <SlidersHorizontal className="size-3.5" aria-hidden />
        Filtros
      </span>
      {children}
      {activeCount > 0 && onClear ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto">
          <X aria-hidden />
          Limpar ({activeCount})
        </Button>
      ) : null}
    </div>
  )
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        'h-8 cursor-pointer rounded-lg border border-line bg-surface px-2.5 text-[13px] text-fg',
        'transition-colors duration-150 hover:border-line-strong',
        'focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]',
        value !== 'todos' && 'border-accent/40 bg-accent-soft text-accent-soft-fg',
      )}
    >
      <option value="todos">{label}: todos</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
