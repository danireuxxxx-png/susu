import { cn } from '@/lib/utils'

/**
 * Marca do produto: um núcleo cercado por um anel aberto — o "centro" de
 * IA.centrism — e o logotipo com a raiz em peso forte e o sufixo em tom neutro.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-accent text-accent-fg shadow-elevated-sm">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="3.1" fill="currentColor" />
          <path
            d="M16.6 4.6a8.6 8.6 0 0 1 0 14.8"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M7.4 19.4a8.6 8.6 0 0 1 0-14.8"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-fg">
            IA<span className="font-medium text-fg-muted">.centrism</span>
          </span>
          <span className="mt-0.5 text-[11px] text-fg-subtle">Centro de comando</span>
        </span>
      ) : null}
    </span>
  )
}
