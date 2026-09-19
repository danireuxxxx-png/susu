import { Pencil, Target } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { ProgressBar } from '@/components/ui/progress'
import { toneForProgress } from '@/lib/tone'
import { useCrm, useCrmData } from '@/hooks/use-crm'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { goalProgress } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import type { Goal } from '@/types'

function formatGoalValue(goal: Goal, value: number) {
  if (goal.unit === 'BRL') return formatCurrency(value)
  if (goal.unit === 'percentual') return formatPercent(value)
  return formatNumber(value)
}

export function GoalsPage() {
  const { goals } = useCrmData()
  const { saveGoal } = useCrm()
  const { toast } = useToast()
  const [editing, setEditing] = useState<Goal | null>(null)
  const [target, setTarget] = useState('')

  const main = goals[0]!
  const mainProgress = goalProgress(main)
  const others = goals.slice(1)

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!editing) return
    await saveGoal({ ...editing, target: Number(target) || editing.target })
    toast({ title: 'Meta atualizada', description: editing.label, tone: 'sucesso' })
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Metas" description={`Acompanhamento de ${main.period.toLowerCase()}.`} />

      <Card>
        <CardHeader
          title="Meta mensal de receita"
          description={main.description}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditing(main)
                setTarget(String(main.target))
              }}
            >
              <Pencil aria-hidden />
              Ajustar meta
            </Button>
          }
        />
        <CardBody>
          <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
            <div>
              <p className="text-[12px] uppercase tracking-wide text-fg-subtle">Atingimento</p>
              <p className="mt-1 text-[52px] font-semibold leading-none tracking-tight text-fg">
                {formatPercent(mainProgress)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] uppercase tracking-wide text-fg-subtle">Realizado</p>
              <p className="text-xl font-semibold text-fg tabular">{formatCurrency(main.current)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] uppercase tracking-wide text-fg-subtle">Meta</p>
              <p className="text-xl font-semibold text-fg-muted tabular">{formatCurrency(main.target)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] uppercase tracking-wide text-fg-subtle">Falta</p>
              <p className="text-xl font-semibold text-fg-muted tabular">
                {formatCurrency(Math.max(0, main.target - main.current))}
              </p>
            </div>
          </div>

          <ProgressBar
            value={mainProgress}
            tone={toneForProgress(mainProgress)}
            className="mt-6 h-2.5"
            label="Atingimento da meta mensal"
          />
        </CardBody>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight text-fg">Metas comerciais</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {others.map((goal) => {
            const progress = goalProgress(goal)
            return (
              <article
                key={goal.id}
                className={cn(
                  'rounded-card border border-line bg-surface p-4 shadow-elevated-sm',
                  'transition-colors duration-150 hover:border-line-strong',
                )}
              >
                <header className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-fg">{goal.label}</h3>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-fg-muted">{goal.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Ajustar meta de ${goal.label}`}
                    onClick={() => {
                      setEditing(goal)
                      setTarget(String(goal.target))
                    }}
                  >
                    <Pencil aria-hidden />
                  </Button>
                </header>

                <div className="mt-4 flex items-baseline justify-between gap-2">
                  <p className="text-xl font-semibold text-fg tabular">{formatGoalValue(goal, goal.current)}</p>
                  <p className="text-[13px] text-fg-muted tabular">de {formatGoalValue(goal, goal.target)}</p>
                </div>

                <ProgressBar
                  value={progress}
                  tone={toneForProgress(progress)}
                  className="mt-3"
                  label={`Progresso de ${goal.label}`}
                />
                <p className="mt-2 text-[12px] font-medium text-fg-muted tabular">{formatPercent(progress)} da meta</p>
              </article>
            )
          })}
        </div>
      </section>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Ajustar meta"
        description={editing ? `${editing.label} · ${editing.period}` : ''}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Novo alvo" htmlFor="goal-target" hint="O valor vale apenas para esta sessão.">
            <Input
              id="goal-target"
              type="number"
              min={0}
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              <Target aria-hidden />
              Salvar meta
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
