import { useCallback, useState } from 'react'

/** Preferencias de UI (sidebar recolhida, visao preferida do pipeline). */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? (next as (value: T) => T)(current) : next
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // Ambiente sem storage (modo privado): mantem so em memoria.
        }
        return resolved
      })
    },
    [key],
  )

  return [value, update] as const
}
