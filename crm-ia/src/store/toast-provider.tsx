import * as Toast from '@radix-ui/react-toast'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { cn, uniqueId } from '@/lib/utils'
import { ToastContext, type ToastItem, type ToastOptions, type ToastTone } from './toast-context'

const TONE_ICON = {
  neutro: Info,
  sucesso: CheckCircle2,
  atencao: AlertTriangle,
  erro: XCircle,
} as const

const TONE_COLOR: Record<ToastTone, string> = {
  neutro: 'text-fg-muted',
  sucesso: 'text-good',
  atencao: 'text-warning',
  erro: 'text-critical',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((options: ToastOptions) => {
    setItems((current) => [...current, { ...options, id: uniqueId('toast') }])
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext value={value}>
      <Toast.Provider swipeDirection="right" duration={4200}>
        {children}
        {items.map((item) => {
          const tone = item.tone ?? 'neutro'
          const Icon = TONE_ICON[tone]
          return (
            <Toast.Root
              key={item.id}
              onOpenChange={(open) => !open && dismiss(item.id)}
              className={cn(
                'flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border border-line bg-surface p-3.5',
                'shadow-elevated-lg data-[state=open]:animate-slide-up data-[state=closed]:opacity-0',
                'transition-opacity duration-150',
              )}
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', TONE_COLOR[tone])} aria-hidden />
              <div className="min-w-0 flex-1">
                <Toast.Title className="text-sm font-medium text-fg">{item.title}</Toast.Title>
                {item.description ? (
                  <Toast.Description className="mt-0.5 text-[13px] leading-relaxed text-fg-muted">
                    {item.description}
                  </Toast.Description>
                ) : null}
                {item.action ? (
                  <Toast.Action asChild altText={item.action.label}>
                    <button
                      type="button"
                      onClick={item.action.onClick}
                      className="mt-2 text-[13px] font-medium text-accent hover:underline"
                    >
                      {item.action.label}
                    </button>
                  </Toast.Action>
                ) : null}
              </div>
              <Toast.Close
                aria-label="Fechar notificação"
                className="rounded-md p-1 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
              >
                <X className="size-3.5" aria-hidden />
              </Toast.Close>
            </Toast.Root>
          )
        })}
        <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-auto flex-col gap-2 outline-none" />
      </Toast.Provider>
    </ToastContext>
  )
}
