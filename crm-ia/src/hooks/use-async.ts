import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Carga de dados por tela, com recarga manual.
 *
 * Telas de rentabilidade leem sob demanda em vez de esperar o snapshot
 * global: o dado é pesado e muda quando um custo é editado.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })

  const run = useCallback(() => {
    let active = true
    setState((current) => ({ ...current, loading: true, error: null }))

    loader()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!active) return
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Não foi possível carregar os dados.',
        })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => run(), [run])

  return { ...state, reload: run }
}
