import type { TransactionSql } from 'postgres'
import type { CommonFilters, PaginationQuery } from './http.js'

/**
 * Montagem de consultas com lista branca.
 *
 * Nenhum nome de coluna vem do cliente: filtros e ordenação são mapeados
 * a partir da configuração do recurso, então não há superfície de
 * injeção por parâmetro de query.
 */
export interface FilterMap {
  [queryParam: string]: string
}

export interface ListOptions {
  table: string
  columns?: string
  searchColumns?: string[]
  sortable: string[]
  defaultSort: string
  /** Direção padrão quando o cliente não pede uma (etapas: crescente). */
  defaultDirection?: 'asc' | 'desc'
  filters?: FilterMap
  /** Filtros de intervalo de data: parâmetro → coluna. */
  dateColumn?: string
  /** Filtros de intervalo de valor: parâmetro → coluna. */
  valueColumn?: string
  softDelete?: boolean
}

export interface ListResult<T> {
  rows: T[]
  total: number
}

function toSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

export async function listRecords<T extends Record<string, unknown>>(
  tx: TransactionSql,
  options: ListOptions,
  pagination: PaginationQuery,
  filters: CommonFilters & Record<string, unknown>,
): Promise<ListResult<T>> {
  const conditions: ReturnType<TransactionSql>[] = []

  if (options.softDelete !== false && !filters.includeDeleted) {
    conditions.push(tx`deleted_at is null`)
  }

  for (const [param, column] of Object.entries(options.filters ?? {})) {
    const value = filters[param]
    if (value === undefined || value === null || value === '') continue
    conditions.push(tx`${tx(column)} = ${value as string}`)
  }

  if (filters.dateFrom && options.dateColumn) {
    conditions.push(tx`${tx(options.dateColumn)} >= ${filters.dateFrom}`)
  }
  if (filters.dateTo && options.dateColumn) {
    conditions.push(tx`${tx(options.dateColumn)} <= ${filters.dateTo}`)
  }
  if (filters.minValue !== undefined && options.valueColumn) {
    conditions.push(tx`${tx(options.valueColumn)} >= ${filters.minValue}`)
  }
  if (filters.maxValue !== undefined && options.valueColumn) {
    conditions.push(tx`${tx(options.valueColumn)} <= ${filters.maxValue}`)
  }

  if (pagination.search && options.searchColumns?.length) {
    const term = `%${pagination.search}%`
    const searchParts = options.searchColumns.map(
      (column) => tx`coalesce(${tx(column)}::text, '') ilike ${term}`,
    )
    const combined = searchParts.reduce((acc, part) => tx`${acc} or ${part}`)
    conditions.push(tx`(${combined})`)
  }

  const where = conditions.length
    ? conditions.reduce((acc, condition) => tx`${acc} and ${condition}`)
    : tx`true`

  const sortColumn = pagination.sort && options.sortable.includes(pagination.sort)
    ? toSnakeCase(pagination.sort)
    : options.defaultSort

  const direction = pagination.sort ? pagination.direction : (options.defaultDirection ?? pagination.direction)
  const offset = (pagination.page - 1) * pagination.limit

  const rows = await tx<T[]>`
    select ${tx.unsafe(options.columns ?? '*')}
    from ${tx(options.table)}
    where ${where}
    order by ${tx(sortColumn)} ${direction === 'asc' ? tx`asc` : tx`desc`}
    limit ${pagination.limit}
    offset ${offset}
  `

  const [countRow] = await tx<{ total: string }[]>`
    select count(*)::text as total from ${tx(options.table)} where ${where}
  `

  return { rows, total: Number(countRow?.total ?? 0) }
}

/** Converte chaves camelCase do corpo para as colunas snake_case. */
export function toColumns(payload: Record<string, unknown>) {
  const entry: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue
    entry[toSnakeCase(key)] = value
  }
  return entry
}
