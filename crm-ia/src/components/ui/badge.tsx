import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { Tone } from '@/constants/labels'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutro: 'border-line bg-surface-inset text-fg-muted',
        info: 'border-transparent bg-[color-mix(in_srgb,var(--accent)12%,transparent)] text-accent-soft-fg',
        destaque: 'border-transparent bg-accent-soft text-accent-soft-fg',
        positivo: 'border-transparent bg-good-soft text-good',
        atencao: 'border-transparent bg-serious-soft text-serious',
        critico: 'border-transparent bg-critical-soft text-critical',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[11px]',
        md: 'px-2 py-0.5 text-xs',
      },
    },
    defaultVariants: { tone: 'neutro', size: 'md' },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof badgeVariants>, 'tone'> {
  tone?: Tone
  /** Ponto colorido antes do texto — identidade sem depender so da cor do chip. */
  dot?: boolean
}

const DOT_COLOR: Record<Tone, string> = {
  neutro: 'bg-fg-subtle',
  info: 'bg-accent',
  destaque: 'bg-accent',
  positivo: 'bg-good',
  atencao: 'bg-serious',
  critico: 'bg-critical',
}

export function Badge({ className, tone = 'neutro', size, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot ? <span className={cn('size-1.5 rounded-full', DOT_COLOR[tone])} aria-hidden /> : null}
      {children}
    </span>
  )
}
