import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarCheck, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ActivityForm } from '@/components/crm/activity-form'
import { FilterBar, FilterSelect } from '@/components/crm/filter-bar'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { Segmented } from '@/components/ui/segmented'
import { ActivityTypeBadge } from '@/components/ui/status-badge'
import { ACTIVITY_TYPES } from '@/constants/labels'
import { useCrm, useCrmData } from '@/hooks/use-crm'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useToast } from '@/hooks/use-toast'
import { formatTime } from '@/lib/format'
import { cn, matches } from '@/lib/utils'
import { memberName } from '@/mock/team'
import type { Activity } from '@/types'

type Scope = 'agenda' | 'pendentes' | 'concluidas'

export function ActivitiesPage() {
  const { activities, team } = useCrmData()
  const { saveActivity, toggleActivity } = useCrm()
  const { toast } = useToast()

  const [scope, setScope] = useState<Scope>('agenda')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  const [type, setType] = useState('todos')
  const [owner, setOwner] = useState('todos')
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)

  const filtered = useMemo(
    () =>
      activities.filter((activity) => {
        if (type !== 'todos' && activity.type !== type) return false
        if (owner !== 'todos' && activity.ownerId !== owner) return false
        if (scope === 'agenda' && new Date(activity.scheduledAt) < startOfToday()) return false
        if (scope === 'pendentes' && activity.done) return false
        if (scope === 'concluidas' && !activity.done) return false
        if (selectedDay && !isSameDay(new Date(activity.scheduledAt), selectedDay)) return false
        return matches([activity.title, activity.companyName, activity.notes], debouncedQuery)
      }),
    [activities, type, owner, scope, selectedDay, debouncedQuery],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, Activity[]>()
    for (const activity of filtered) {
      const key = activity.scheduledAt.slice(0, 10)
      const list = map.get(key) ?? []
      list.push(activity)
      map.set(key, list)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { locale: ptBR })
    const end = endOfWeek(endOfMonth(month), { locale: ptBR })
    return eachDayOfInterval({ start, end })
  }, [month])

  const countByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const activity of activities) {
      const key = activity.scheduledAt.slice(0, 10)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [activities])

  const pending = activities.filter((activity) => !activity.done).length

  async function handleSave(activity: Activity) {
    await saveActivity(activity)
    toast({ title: editing ? 'Atividade atualizada' : 'Atividade agendada', description: activity.title, tone: 'sucesso' })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Atividades"
        description={`${pending} atividades pendentes · ${activities.length} no total`}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus aria-hidden />
            Nova atividade
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          ariaLabel="Escopo das atividades"
          options={[
            { value: 'agenda' as const, label: 'Agenda' },
            { value: 'pendentes' as const, label: 'Pendentes' },
            { value: 'concluidas' as const, label: 'Concluídas' },
          ]}
          value={scope}
          onChange={setScope}
        />
        {selectedDay ? (
          <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
            Limpar dia selecionado ({format(selectedDay, "dd 'de' MMMM", { locale: ptBR })})
          </Button>
        ) : null}
      </div>

      <FilterBar
        activeCount={[type, owner].filter((value) => value !== 'todos').length}
        onClear={() => {
          setType('todos')
          setOwner('todos')
          setQuery('')
        }}
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar atividade ou empresa"
          className="w-full sm:w-72"
        />
        <FilterSelect
          label="Tipo"
          value={type}
          onChange={setType}
          options={ACTIVITY_TYPES.map((item) => ({ value: item.id, label: item.label }))}
        />
        <FilterSelect
          label="Responsável"
          value={owner}
          onChange={setOwner}
          options={team.map((member) => ({ value: member.id, label: member.name }))}
        />
      </FilterBar>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader
            title={format(month, 'MMMM yyyy', { locale: ptBR }).replace(/^./, (char) => char.toUpperCase())}
            action={
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Mês anterior"
                  onClick={() => setMonth((current) => subMonths(current, 1))}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Próximo mês"
                  onClick={() => setMonth((current) => addMonths(current, 1))}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            }
          />
          <CardBody>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((label, index) => (
                <span key={`${label}-${index}`} className="py-1 text-[11px] font-medium text-fg-subtle">
                  {label}
                </span>
              ))}
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const count = countByDay.get(key) ?? 0
                const selected = selectedDay ? isSameDay(day, selectedDay) : false
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(selected ? null : day)}
                    className={cn(
                      'relative flex h-9 flex-col items-center justify-center rounded-lg text-[12px] transition-colors duration-100',
                      isSameMonth(day, month) ? 'text-fg' : 'text-fg-subtle/60',
                      selected ? 'bg-accent text-accent-fg' : 'hover:bg-surface-hover',
                      isToday(day) && !selected && 'font-semibold text-accent',
                    )}
                  >
                    {format(day, 'd')}
                    {count > 0 ? (
                      <span
                        className={cn(
                          'absolute bottom-1 size-1 rounded-full',
                          selected ? 'bg-accent-fg' : 'bg-accent',
                        )}
                        aria-hidden
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          {grouped.length ? (
            grouped.map(([day, items]) => (
              <Card key={day}>
                <CardHeader
                  title={formatDayLabel(day)}
                  description={`${items.length} ${items.length === 1 ? 'atividade' : 'atividades'}`}
                />
                <CardBody className="pt-0">
                  <ul className="divide-y divide-line">
                    {items.map((activity) => (
                      <li key={activity.id} className="flex items-start gap-3 py-3">
                        <Checkbox
                          checked={activity.done}
                          onCheckedChange={() => toggleActivity(activity.id)}
                          aria-label={`Marcar ${activity.title} como concluída`}
                          className="mt-0.5"
                        />
                        <span className="w-12 shrink-0 pt-px text-[13px] font-medium text-fg-muted tabular">
                          {formatTime(activity.scheduledAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(activity)
                            setFormOpen(true)
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p
                            className={cn(
                              'truncate text-[13px] font-medium text-fg',
                              activity.done && 'text-fg-subtle line-through',
                            )}
                          >
                            {activity.title}
                          </p>
                          <p className="truncate text-[12px] text-fg-muted">
                            {activity.companyName} · {memberName(activity.ownerId)} · {activity.durationMinutes} min
                          </p>
                        </button>
                        <ActivityTypeBadge type={activity.type} size="sm" />
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="rounded-card border border-line bg-surface">
              <EmptyState
                icon={CalendarCheck}
                title="Nenhuma atividade encontrada"
                description="Ajuste os filtros ou agende um novo compromisso."
                action={
                  <Button variant="primary" onClick={() => setFormOpen(true)}>
                    <Plus aria-hidden />
                    Nova atividade
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      <ActivityForm open={formOpen} onOpenChange={setFormOpen} activity={editing} onSubmit={handleSave} />
    </div>
  )
}

function formatDayLabel(day: string) {
  const date = new Date(`${day}T12:00:00`)
  const label = format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
  const prefix = isToday(date) ? 'Hoje · ' : ''
  return prefix + label.replace(/^./, (char) => char.toUpperCase())
}
