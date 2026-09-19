import { cn } from '@/lib/utils'

/** Marca do produto — o "N" em um quadrado com o acento da paleta. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-accent text-accent-fg shadow-elevated-sm">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
          <path
            d="M5 19V5l14 14V5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-fg">Nexo</span>
          <span className="mt-0.5 text-[11px] text-fg-subtle">Centro de comando</span>
        </span>
      ) : null}
    </span>
  )
}
