import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Remove acentos e caixa para buscas tolerantes ("Joao" encontra "João"). */
export function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function matches(haystack: Array<string | number | null | undefined>, query: string) {
  if (!query.trim()) return true
  const needle = normalize(query)
  return haystack.some((value) => value != null && normalize(String(value)).includes(needle))
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function sum<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0)
}

export function groupBy<T, K extends string>(items: T[], selector: (item: T) => K) {
  return items.reduce(
    (acc, item) => {
      const key = selector(item)
      ;(acc[key] ??= []).push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}

export function uniqueId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/** Divisao segura: evita NaN/Infinity em indicadores calculados. */
export function ratio(part: number, total: number) {
  if (!total) return 0
  return part / total
}
