import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' } as const

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] data-[state=open]:animate-fade-in dark:bg-black/60" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border border-line bg-surface shadow-elevated-lg',
            'data-[state=open]:animate-slide-up focus:outline-none',
            SIZES[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-fg">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-[13px] text-fg-muted">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
            >
              <X className="size-4" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
          {footer ? (
            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  children?: ReactNode
}

/** Confirmacao de acoes destrutivas — sempre antes de excluir. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Excluir',
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={children}
    >
      <p className="text-[13px] leading-relaxed text-fg-muted">
        Esta ação não pode ser desfeita nesta sessão.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="h-9 rounded-lg border border-line bg-surface px-3.5 text-sm font-medium text-fg transition-colors hover:bg-surface-hover"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm()
            onOpenChange(false)
          }}
          className="h-9 rounded-lg bg-critical px-3.5 text-sm font-medium text-white transition-[filter] hover:brightness-95"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
