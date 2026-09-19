import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Página não encontrada"
      description="O endereço acessado não existe no CRM. Volte para o dashboard e continue de onde parou."
      action={
        <Button variant="primary" asChild>
          <Link to="/dashboard">Ir para o dashboard</Link>
        </Button>
      }
    />
  )
}
