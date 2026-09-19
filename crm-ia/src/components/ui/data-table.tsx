import { ArrowDown, ArrowUp, ChevronsUpDown, type LucideIcon } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { EmptyState } from './empty-state'
import { SkeletonTable } from './skeleton'

export interface Column<T> {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Valor usado na ordenacao; ausente torna a coluna nao ordenavel. */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right'
  width?: string
  /** Colunas secundarias somem antes em telas estreitas. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription?: string
  emptyAction?: ReactNode
  initialSort?: { columnId: string; direction: 'asc' | 'desc' }
  className?: string
}

const HIDE_CLASS = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
} as const

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading = false,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  initialSort,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort ?? null)

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((item) => item.id === sort.columnId)
    if (!column?.sortValue) return rows
    const direction = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a)
      const right = column.sortValue!(b)
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction
      return String(left).localeCompare(String(right), 'pt-BR') * direction
    })
  }, [rows, columns, sort])

  function toggleSort(columnId: string) {
    setSort((current) => {
      if (current?.columnId !== columnId) return { columnId, direction: 'asc' }
      if (current.direction === 'asc') return { columnId, direction: 'desc' }
      return null
    })
  }

  if (loading) {
    return (
      <div className={cn('overflow-hidden rounded-card border border-line bg-surface', className)}>
        <SkeletonTable />
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className={cn('rounded-card border border-line bg-surface', className)}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-card border border-line bg-surface', className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-muted">
              {columns.map((column) => {
                const sortable = Boolean(column.sortValue)
                const active = sort?.columnId === column.id
                return (
                  <th
                    key={column.id}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      'whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-medium tracking-wide text-fg-subtle',
                      column.align === 'right' && 'text-right',
                      column.hideBelow && HIDE_CLASS[column.hideBelow],
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.id)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded transition-colors hover:text-fg',
                          active && 'text-fg',
                          column.align === 'right' && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        {active ? (
                          sort?.direction === 'asc' ? (
                            <ArrowUp className="size-3" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-50" aria-hidden />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sortedRows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors duration-100',
                  onRowClick && 'cursor-pointer hover:bg-surface-hover',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      'whitespace-nowrap px-4 py-3 align-middle text-fg',
                      column.align === 'right' && 'text-right tabular',
                      column.hideBelow && HIDE_CLASS[column.hideBelow],
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
