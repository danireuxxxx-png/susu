import { cn, clamp } from '@/lib/utils'
import type { ProgressTone } from '@/lib/tone'

interface ProgressBarProps {
  value: number
  /** 0–100. Acima de 100 a barra satura, mas o rotulo mostra o valor real. */
  tone?: ProgressTone
  size?: 'sm' | 'md'
  className?: string
  label?: string
}

const TONE_FILL = {
  accent: 'bg-accent',
  positivo: 'bg-good',
  atencao: 'bg-warning',
  critico: 'bg-critical',
} as const

export function ProgressBar({ value, tone = 'accent', size = 'md', className, label }: ProgressBarProps) {
  const percent = clamp(value, 0, 100)
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-surface-inset', size === 'sm' ? 'h-1.5' : 'h-2', className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', TONE_FILL[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
