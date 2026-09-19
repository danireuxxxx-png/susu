import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { AgentStatusBadge } from '@/components/ui/status-badge'
import { useCrmData } from '@/hooks/use-crm'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { AI_AGENTS } from '@/mock/agents'

export function AgentsPage() {
  const { opportunities } = useCrmData()
  const { toast } = useToast()
  const active = AI_AGENTS.filter((agent) => agent.status === 'ativo').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agentes de IA"
        description={`${active} de ${AI_AGENTS.length} agentes ativos cuidando da operação comercial.`}
      />

      <div className="rounded-card border border-dashed border-line bg-surface-muted px-4 py-3 text-[13px] leading-relaxed text-fg-muted">
        Nesta versão os agentes são demonstrativos: as telas mostram como cada um vai operar, mas nenhuma
        mensagem é enviada e nenhum modelo é chamado. O pipeline atual tem{' '}
        <strong className="font-medium text-fg">{opportunities.length} oportunidades</strong> que serão
        monitoradas automaticamente quando a integração entrar.
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {AI_AGENTS.map((agent) => (
          <article
            key={agent.id}
            className={cn(
              'flex flex-col rounded-card border border-line bg-surface p-5 shadow-elevated-sm',
              'transition-colors duration-150 hover:border-line-strong',
            )}
          >
            <header className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-soft-fg">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-fg">{agent.name}</h2>
                  <p className="mt-0.5 text-[12px] text-fg-muted">{agent.role}</p>
                </div>
              </div>
              <AgentStatusBadge status={agent.status} />
            </header>

            <p className="mt-4 text-[13px] leading-relaxed text-fg-muted">{agent.description}</p>

            <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-line bg-surface-muted p-3">
              {agent.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-[11px] leading-tight text-fg-subtle">{metric.label}</dt>
                  <dd className="mt-1 text-[15px] font-semibold text-fg tabular">{metric.value}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-4 space-y-1.5">
              {agent.capabilities.map((capability) => (
                <li key={capability} className="flex items-start gap-2 text-[12px] text-fg-muted">
                  <Check className="mt-0.5 size-3 shrink-0 text-good" aria-hidden />
                  {capability}
                </li>
              ))}
            </ul>

            <footer className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4">
              {agent.href ? (
                <Button variant="secondary" size="sm" asChild>
                  <Link to={agent.href}>
                    Abrir agente
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    toast({
                      title: `${agent.name} ainda não está disponível`,
                      description: 'A configuração entra junto com o backend e a API de IA.',
                      tone: 'neutro',
                    })
                  }
                >
                  Configurar
                </Button>
              )}
              <span className="text-[11px] text-fg-subtle">
                {agent.status === 'ativo' ? 'Rodando em produção simulada' : 'Aguardando integração'}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}
