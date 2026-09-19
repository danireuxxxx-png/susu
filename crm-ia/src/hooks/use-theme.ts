import { useContext } from 'react'
import { CHART_THEMES } from '@/constants/charts'
import { ThemeContext } from '@/store/theme-context'

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme precisa estar dentro de <ThemeProvider>.')
  return context
}

/** Paleta de graficos do tema atual — o modo escuro tem steps proprios. */
export function useChartTheme() {
  const { theme } = useTheme()
  return CHART_THEMES[theme]
}
