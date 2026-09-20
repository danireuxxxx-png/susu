import { useId } from 'react'
import { useChartTheme } from '@/hooks/use-theme'

interface SparklineProps {
  points: number[]
  className?: string
  width?: number
  height?: number
}

/**
 * Micro-tendencia dos KPI tiles: linha em tom recessivo com o ponto atual
 * destacado. Sem eixo, sem rotulo — o numero grande e quem conta a historia.
 */
export function Sparkline({ points, className, width = 96, height = 28 }: SparklineProps) {
  const theme = useChartTheme()
  const gradientId = useId()

  if (points.length < 2) return null

  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  // Recuo a direita para o ponto final (raio + anel) caber dentro do viewBox.
  const inset = 4
  const step = (width - inset) / (points.length - 1)

  const coordinates = points.map((value, index) => ({
    x: index * step,
    y: height - 2 - ((value - min) / span) * (height - 6),
  }))

  const line = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const last = coordinates[coordinates.length - 1]!

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="presentation"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.series[0]} stopOpacity={0.16} />
          <stop offset="100%" stopColor={theme.series[0]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={theme.series[0]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
      <circle cx={last.x} cy={last.y} r={3} fill={theme.series[0]} stroke={theme.surface} strokeWidth={2} />
    </svg>
  )
}
