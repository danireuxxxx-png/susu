import { MARGIN_ALERT_THRESHOLD } from '@/constants/costs'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MarginIndicatorProps {
  value: number
  /** Receita do período: sem ela a margem não existe, e 0% mentiria. */
  revenue?: number
  className?: string
}

/**
 * Margem com leitura de severidade.
 *
 * Abaixo do limite de alerta o número fica em tom de atenção, e margem
 * negativa salta em vermelho. Quando não há receita, mostra um traço:
 * dizer "0%" para um projeto que só custa esconde o problema.
 */
export function MarginIndicator({ value, revenue, className }: MarginIndicatorProps) {
  if (revenue !== undefined && revenue === 0) {
    return (
      <span className={cn('text-fg-subtle', className)} title="Sem receita recorrente no mês">
        —
      </span>
    )
  }

  const tone =
    value < 0 ? 'text-critical' : value < MARGIN_ALERT_THRESHOLD ? 'text-serious' : 'text-good'

  return <span className={cn('font-medium tabular', tone, className)}>{formatPercent(value)}</span>
}
