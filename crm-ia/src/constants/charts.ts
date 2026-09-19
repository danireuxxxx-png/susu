/**
 * Tokens de visualizacao de dados.
 *
 * As duas paletas categoricas foram validadas para daltonismo e contraste
 * contra as superficies reais do produto (#ffffff no claro, #17171b no
 * escuro). O modo escuro nao e uma inversao: e a mesma sequencia de matizes
 * reajustada para a superficie escura.
 */

export interface ChartTheme {
  series: string[]
  ordinal: string[]
  reference: string
  grid: string
  axis: string
  text: string
  textMuted: string
  surface: string
  tooltipShadow: string
  good: string
  critical: string
}

const LIGHT: ChartTheme = {
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  ordinal: ['#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95'],
  reference: '#c9c9c3',
  grid: '#eceae6',
  axis: '#d6d6d0',
  text: '#14141a',
  textMuted: '#57575f',
  surface: '#ffffff',
  tooltipShadow: '0 2px 6px rgba(20,20,26,0.06), 0 24px 48px -20px rgba(20,20,26,0.22)',
  good: '#0ca30c',
  critical: '#d03b3b',
}

const DARK: ChartTheme = {
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  ordinal: ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6'],
  reference: '#4a4a55',
  grid: '#24242b',
  axis: '#33333c',
  text: '#f3f3f6',
  textMuted: '#a3a3ae',
  surface: '#17171b',
  tooltipShadow: '0 2px 6px rgba(0,0,0,0.5), 0 24px 48px -20px rgba(0,0,0,0.8)',
  good: '#0ca30c',
  critical: '#d03b3b',
}

export const CHART_THEMES = { light: LIGHT, dark: DARK } as const

/** Espessuras e espacos fixos — o dado e a unica coisa que pode ser "alta". */
export const CHART_SPEC = {
  lineWidth: 2,
  dotRadius: 4,
  activeDotRadius: 5,
  barSize: 22,
  barRadius: 4,
  /** Respiro em cor de superficie entre marcas que se tocam. */
  stackGap: 2,
  areaOpacity: 0.1,
} as const

export type RevenueRange = '7d' | '30d' | '90d' | '12m'

/** Recortes do grafico de receita — o mesmo conjunto no dashboard e no financeiro. */
export const REVENUE_RANGE_OPTIONS: { value: RevenueRange; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '12m', label: '12 meses' },
]
