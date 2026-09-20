import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatSignedPercent } from '@/lib/format'

interface DeltaProps {
  value: number | null
  /** Em custo, cair e bom: inverte a leitura de cor. */
  invert?: boolean
  /** Diferenca entre dois percentuais e medida em pontos, nao em porcento. */
  unit?: 'percent' | 'points'
  suffix?: string
  className?: string
}

export function Delta({ value, invert = false, unit = 'percent', suffix, className }: DeltaProps) {
  if (value === null || Number.isNaN(value)) {
    return <span className={cn('text-[13px] text-fg-subtle', className)}>sem comparativo</span>
  }

  const neutral = Math.abs(value) < 0.05
  const positive = invert ? value < 0 : value > 0
  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-medium tabular',
        neutral ? 'text-fg-subtle' : positive ? 'text-good' : 'text-critical',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {unit === 'points'
        ? `${value > 0 ? '+' : ''}${value.toFixed(1).replace('.', ',')} p.p.`
        : formatSignedPercent(value)}
      {suffix ? <span className="font-normal text-fg-subtle">{suffix}</span> : null}
    </span>
  )
}
