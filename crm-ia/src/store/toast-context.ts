import { createContext } from 'react'

export type ToastTone = 'neutro' | 'sucesso' | 'atencao' | 'erro'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  action?: { label: string; onClick: () => void }
}

export interface ToastItem extends ToastOptions {
  id: string
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
