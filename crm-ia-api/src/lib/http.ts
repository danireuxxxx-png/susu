import { z } from 'zod'

/** Envelope padrão das listagens: dados + metadados de paginação. */
export interface Paginated<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  direction: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().min(1).max(120).optional(),
})

export type PaginationQuery = z.infer<typeof paginationSchema>

export function paginate<T>(rows: T[], total: number, query: PaginationQuery): Paginated<T> {
  return {
    data: rows,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  }
}

export const uuidParam = z.object({ id: z.string().uuid('Identificador inválido') })

/** Filtros aceitos por qualquer listagem; cada recurso declara quais usa. */
export const commonFiltersSchema = z.object({
  status: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  category: z.string().optional(),
  provider: z.string().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  priority: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minValue: z.coerce.number().optional(),
  maxValue: z.coerce.number().optional(),
  includeDeleted: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
})

export type CommonFilters = z.infer<typeof commonFiltersSchema>

/** Data de referência dos relatórios financeiros (default: hoje). */
export const referenceSchema = z.object({
  reference: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD')
    .optional(),
})
