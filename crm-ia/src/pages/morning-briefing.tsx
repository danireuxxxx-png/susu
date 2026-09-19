import { ArrowRight, BarChart3, CheckCircle2, Flame, Lightbulb, RefreshCw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AiBadge, AiInsightCard } from '@/components/crm/ai-insight-card'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Delta } from '@/components/ui/delta'
import { PageHeader } from '@/components/ui/page-header'
import { PriorityBadge } from '@/components/ui/status-badge'
import { ProgressBar } from '@/components/ui/progress'
import { toneForProgress } from '@/lib/tone'
import { SectionTitle } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useCrm, useCrmData } from '@/hooks/use-crm'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatLongDate } from '@/lib/format'
import { ratio } from '@/lib/utils'
import { CURRENT_USER } from '@/mock/team'
import { aiService } from '@/services'

export function MorningBriefingPage() {
  const { briefing } = useCrmData()
  const { toggleBriefingTask } = useCrm()
  const { toast } = useToast()
  const [regenerating, setRegenerating] = useState(false)

  const done = briefing.tasks.filter((task) => task.done).length
  const progress = ratio(done, briefing.tasks.length) * 100

  async function regenerate() {
    setRegenerating(true)
    try {
      await aiService.generateBriefing()
      toast({
        title: 'Briefing atualizado',
        description: 'Nesta versão o texto é simulado — o agente real roda todas as manhãs às 7h.',
        tone: 'neutro',
      })
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bom dia, ${CURRENT_USER.name.split(' ')[0]}.`}
        description={`Seu briefing de hoje — ${formatLongDate(briefing.date)}`}
        actions={
          <Button variant="secondary" onClick={regenerate} loading={regenerating}>
            <RefreshCw aria-hidden />
            Gerar novamente
          </Button>
        }
      />

      <Card className="border-accent/30 bg-[linear-gradient(180deg,var(--accent-soft),transparent_72%)]">
        <CardBody className="pt-5">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-fg">Resumo do agente</p>
                <AiBadge label="Gerado por IA" />
              </div>
              {regenerating ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-11/12" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              ) : (
                <p className="mt-2 text-[15px] leading-relaxed text-fg">{briefing.narrative}</p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <section className="space-y-3">
        <SectionTitle
          title={
            <span className="flex items-center gap-2">
              <BarChart3 className="size-4 text-fg-subtle" aria-hidden />
              Ontem em números
            </span>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {briefing.metrics.map((metric) => (
            <div key={metric.label} className="rounded-card border border-line bg-surface p-4 shadow-elevated-sm">
              <p className="text-[13px] font-medium text-fg-muted">{metric.label}</p>
              <p className="mt-2 text-[22px] font-semibold leading-none tracking-tight text-fg">{metric.value}</p>
              <div className="mt-2">
                <Delta value={metric.delta} suffix="vs. dia anterior" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle
          title={
            <span className="flex items-center gap-2">
              <Flame className="size-4 text-critical" aria-hidden />
              Prioridades de hoje
            </span>
          }
          description="O que move o ponteiro se for resolvido nas próximas horas."
        />
        <ol className="space-y-3">
          {briefing.priorities.map((priority, index) => (
            <li key={priority.id}>
              <article className="flex flex-wrap items-start gap-4 rounded-card border border-line bg-surface p-4 shadow-elevated-sm transition-colors duration-150 hover:border-line-strong">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-inset text-[13px] font-semibold text-fg-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-fg">{priority.title}</h3>
                    <PriorityBadge priority={priority.priority} size="sm" />
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{priority.description}</p>
                  <p className="mt-2 text-[13px] font-semibold text-fg tabular">
                    {formatCurrency(priority.value)}
                  </p>
                </div>
                {priority.opportunityId ? (
                  <Button variant="secondary" size="sm" asChild>
                    <Link to={`/pipeline?oportunidade=${priority.opportunityId}`}>
                      Ver oportunidade
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                ) : null}
              </article>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3">
          <SectionTitle
            title={
              <span className="flex items-center gap-2">
                <Lightbulb className="size-4 text-accent" aria-hidden />
                Insights da IA
              </span>
            }
          />
          <div className="space-y-2.5">
            {briefing.insights.map((insight) => (
              <AiInsightCard key={insight.id} text={insight.text} tone={insight.tone} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle
            title={
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-good" aria-hidden />
                O que fazer hoje
              </span>
            }
          />
          <Card>
            <CardHeader
              title={`${done}/${briefing.tasks.length} tarefas concluídas`}
              description="Marque conforme avança — o progresso é só desta sessão."
            />
            <CardBody className="pt-0">
              <ProgressBar
                value={progress}
                tone={toneForProgress(progress)}
                label="Progresso das tarefas do dia"
              />
              <ul className="mt-4 divide-y divide-line">
                {briefing.tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 py-2.5">
                    <Checkbox
                      checked={task.done}
                      onCheckedChange={() => toggleBriefingTask(task.id)}
                      id={task.id}
                    />
                    <label
                      htmlFor={task.id}
                      className={`cursor-pointer text-[13px] ${
                        task.done ? 'text-fg-subtle line-through' : 'text-fg'
                      }`}
                    >
                      {task.label}
                    </label>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>
      </div>

      <p className="rounded-card border border-dashed border-line bg-surface-muted px-4 py-3 text-[12px] leading-relaxed text-fg-muted">
        Este briefing é montado a partir dos dados do próprio CRM. Quando o agente estiver conectado, ele roda
        todas as manhãs às 7h e envia o resumo por e-mail e WhatsApp.
      </p>
    </div>
  )
}
