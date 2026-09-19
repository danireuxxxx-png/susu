import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { ACTIVITY_TYPES } from '@/constants/labels'
import { useCrmData } from '@/hooks/use-crm'
import { uniqueId } from '@/lib/utils'
import type { Activity, ActivityType } from '@/types'

interface ActivityFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: Activity | null
  /** Pre-seleciona empresa/oportunidade quando aberto de dentro do negócio. */
  context?: { companyId: string; companyName: string; opportunityId: string | null }
  onSubmit: (activity: Activity) => Promise<void> | void
}

function toDateTimeInput(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function ActivityForm({ open, onOpenChange, activity, context, onSubmit }: ActivityFormProps) {
  const { companies, team } = useCrmData()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => buildInitialState(activity, context, companies[0]!.id, team[0]!.id))

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(activity, context, companies[0]!.id, team[0]!.id))
      setError('')
    }
  }, [open, activity, context, companies, team])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('Descreva a atividade.')
      return
    }

    const company = companies.find((item) => item.id === form.companyId)
    const payload: Activity = {
      id: activity?.id ?? uniqueId('atv'),
      type: form.type,
      title: form.title.trim(),
      companyId: company?.id ?? '',
      companyName: company?.tradeName ?? 'Interno',
      opportunityId: context?.opportunityId ?? activity?.opportunityId ?? null,
      ownerId: form.ownerId,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      durationMinutes: Number(form.durationMinutes),
      done: activity?.done ?? false,
      notes: form.notes.trim(),
    }

    setSaving(true)
    try {
      await onSubmit(payload)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={activity ? 'Editar atividade' : 'Nova atividade'}
      description="Ligações, reuniões, follow-ups e tarefas internas do time."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Descrição" htmlFor="act-title" error={error}>
          <Input
            id="act-title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ex.: Follow-up da proposta"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo" htmlFor="act-type">
            <Select
              id="act-type"
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({ ...current, type: event.target.value as ActivityType }))
              }
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Empresa" htmlFor="act-company">
            <Select
              id="act-company"
              value={form.companyId}
              disabled={Boolean(context)}
              onChange={(event) => setForm((current) => ({ ...current, companyId: event.target.value }))}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.tradeName}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Data e hora" htmlFor="act-date">
            <Input
              id="act-date"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
            />
          </Field>

          <Field label="Duração (min)" htmlFor="act-duration">
            <Input
              id="act-duration"
              type="number"
              min={5}
              step={5}
              value={form.durationMinutes}
              onChange={(event) =>
                setForm((current) => ({ ...current, durationMinutes: event.target.value }))
              }
            />
          </Field>

          <Field label="Responsável" htmlFor="act-owner" className="sm:col-span-2">
            <Select
              id="act-owner"
              value={form.ownerId}
              onChange={(event) => setForm((current) => ({ ...current, ownerId: event.target.value }))}
            >
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Observações" htmlFor="act-notes">
          <Textarea
            id="act-notes"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {activity ? 'Salvar atividade' : 'Agendar atividade'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function buildInitialState(
  activity: Activity | null,
  context: ActivityFormProps['context'],
  fallbackCompanyId: string,
  fallbackOwnerId: string,
) {
  const base = new Date()
  base.setMinutes(0, 0, 0)
  base.setHours(base.getHours() + 1)

  return {
    type: activity?.type ?? ('follow-up' as ActivityType),
    title: activity?.title ?? '',
    companyId: activity?.companyId || context?.companyId || fallbackCompanyId,
    scheduledAt: toDateTimeInput(activity?.scheduledAt ?? base.toISOString()),
    durationMinutes: String(activity?.durationMinutes ?? 30),
    ownerId: activity?.ownerId ?? fallbackOwnerId,
    notes: activity?.notes ?? '',
  }
}
