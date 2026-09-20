/** Erro de aplicação com status HTTP — tudo que o cliente pode ver. */
export class AppError extends Error {
  statusCode: number
  code: string
  details?: unknown

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export const unauthorized = (message = 'Autenticação necessária') =>
  new AppError(message, 401, 'UNAUTHORIZED')

export const forbidden = (message = 'Você não tem permissão para esta ação') =>
  new AppError(message, 403, 'FORBIDDEN')

export const notFound = (resource = 'Recurso') => new AppError(`${resource} não encontrado`, 404, 'NOT_FOUND')

export const conflict = (message: string) => new AppError(message, 409, 'CONFLICT')

export const unprocessable = (message: string, details?: unknown) =>
  new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details)

/**
 * Traduz erros do Postgres para HTTP sem vazar detalhe interno.
 *
 * O código 42501 (insufficient privilege) e o resultado vazio em UPDATE
 * costumam significar RLS barrando — e a resposta correta é 403/404, não
 * 500: o usuário não deve descobrir que a linha existe em outro tenant.
 */
export function translateDatabaseError(error: unknown): AppError | null {
  const pgError = error as { code?: string; message?: string; constraint_name?: string; detail?: string }
  if (!pgError?.code) return null

  switch (pgError.code) {
    case '23505':
      return conflict('Já existe um registro com esses dados')
    case '23503':
      return new AppError('Referência inválida para outro registro', 422, 'INVALID_REFERENCE')
    case '23502':
      return unprocessable('Campo obrigatório ausente')
    case '23514':
      return unprocessable('Os dados violam uma regra de validação do banco')
    case '22P02':
      return unprocessable('Formato de dado inválido')
    case '42501':
      return forbidden('Seu papel não permite esta operação')
    case '28000':
      return unauthorized()
    case 'P0002':
      return notFound('Registro')
    case 'P0001':
      return new AppError(pgError.message ?? 'Operação inválida', 409, 'OPERATION_REJECTED')
    default:
      return null
  }
}
