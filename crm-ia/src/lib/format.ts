import { differenceInCalendarDays, format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const currencyPrecise = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const decimal = new Intl.NumberFormat('pt-BR')

export function formatCurrency(value: number, precise = false) {
  return precise ? currencyPrecise.format(value) : currency.format(value)
}

/** Versao compacta para eixos e tiles: R$ 184,5 mil / R$ 1,2 mi. */
export function formatCompactCurrency(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `R$ ${decimal.format(Number((value / 1_000_000).toFixed(1)))} mi`
  if (abs >= 1_000) return `R$ ${decimal.format(Math.round(value / 1_000))} mil`
  return currency.format(value)
}

export function formatNumber(value: number) {
  return decimal.format(value)
}

export function formatPercent(value: number, fractionDigits = 1) {
  return `${decimal.format(Number(value.toFixed(fractionDigits)))}%`
}

export function formatSignedPercent(value: number, fractionDigits = 1) {
  const signal = value > 0 ? '+' : ''
  return `${signal}${decimal.format(Number(value.toFixed(fractionDigits)))}%`
}

export function toDate(value: string | Date) {
  return typeof value === 'string' ? parseISO(value) : value
}

export function formatDate(value: string | Date, pattern = "dd MMM yyyy") {
  return format(toDate(value), pattern, { locale: ptBR })
}

export function formatLongDate(value: string | Date) {
  return format(toDate(value), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatTime(value: string | Date) {
  return format(toDate(value), 'HH:mm', { locale: ptBR })
}

export function formatDateTime(value: string | Date) {
  return format(toDate(value), "dd MMM 'às' HH:mm", { locale: ptBR })
}

/** "Hoje 14:00", "Amanhã 09:30", "12 set 16:00" — usado em agenda e follow-ups. */
export function formatFriendlyDateTime(value: string | Date) {
  const date = toDate(value)
  if (isToday(date)) return `Hoje ${formatTime(date)}`
  if (isTomorrow(date)) return `Amanhã ${formatTime(date)}`
  if (isYesterday(date)) return `Ontem ${formatTime(date)}`
  return formatDateTime(date)
}

export function formatRelative(value: string | Date) {
  return formatDistanceToNowStrict(toDate(value), { locale: ptBR, addSuffix: true })
}

export function daysSince(value: string | Date) {
  return Math.max(0, differenceInCalendarDays(new Date(), toDate(value)))
}

export function daysUntil(value: string | Date) {
  return differenceInCalendarDays(toDate(value), new Date())
}
