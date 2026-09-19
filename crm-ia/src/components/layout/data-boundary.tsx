import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useCrm } from '@/hooks/use-crm'
import { PageSkeleton } from './page-skeleton'

/**
 * Segura os estados de carga e erro em um lugar so: dentro dele as telas
 * podem assumir que o snapshot existe (`useCrmData`).
 */
export function DataBoundary({ children }: { children: ReactNode }) {
  const { status, error, reload } = useCrm()

  if (status === 'error') {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Não foi possível carregar o workspace"
        description={error ?? 'Tente novamente em alguns instantes.'}
        action={
          <Button variant="primary" onClick={reload}>
            <RefreshCw aria-hidden />
            Tentar novamente
          </Button>
        }
      />
    )
  }

  if (status !== 'ready') return <PageSkeleton />

  return <>{children}</>
}
