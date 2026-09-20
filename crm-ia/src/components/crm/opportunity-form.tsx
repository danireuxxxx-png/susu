import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { LEAD_SOURCES, PRIORITIES } from '@/constants/labels'
import { PIPELINE_STAGES, STAGE_BY_ID } from '@/constants/pipeline'
import { useCrmData } from '@/hooks/use-crm'
import { uniqueId } from '@/lib/utils'
import type { LeadSource, Opportunity, PipelineStageId, Priority } from '@/types'

interface OpportunityFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunity: Opportunity | null
  defaultStage?: PipelineStageId
  onSubmit: (opportunity: Opportunity) => Promise<void> | void
}

interface FormState {
  title: string
  companyId: string
  contactId: string
  value: string
  stage: PipelineStageId
  probability: string
  priority: Priority
  source: LeadSource
  ownerId: string
  expectedCloseAt: string
  nextActionLabel: string
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

export function OpportunityForm({
  open,
  onOpenChange,
  opportunity,
  defaultStage = 'novo-lead',
  onSubmit,
}: OpportunityFormProps) {
  const { companies, team } = useCrmData()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<FormState>(() => buildInitialState(opportunity, defaultStage, companies[0]!.id, team[0]!.id))

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(opportunity, defaultStage, companies[0]!.id, team[0]!.id))
      setErrors({})
    }
  }, [open, opportunity, defaultStage, companies, team])

  const selectedCompany = companies.find((company) => company.id === form.companyId) ?? companies[0]!
  const contacts = selectedCompany.contacts

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.title.trim()) nextErrors.title = 'Informe o que está sendo vendido.'
    if (!form.value || Number(form.value) <= 0) nextErrors.value = 'Informe um valor maior que zero.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const contact = contacts.find((item) => item.id === form.contactId) ?? contacts[0]!
    const now = new Date().toISOString()

    const payload: Opportunity = {
      id: opportunity?.id ?? uniqueId('opo'),
      title: form.title.trim(),
      companyId: selectedCompany.id,
      companyName: selectedCompany.tradeName,
      contactId: contact.id,
      contactName: contact.name,
      value: Number(form.value),
      stage: form.stage,
      probability: Number(form.probability),
      priority: form.priority,
      source: form.source,
      ownerId: form.ownerId,
      createdAt: opportunity?.createdAt ?? now,
      expectedCloseAt: form.expectedCloseAt
        ? new Date(`${form.expectedCloseAt}T12:00:00`).toISOString()
        : now,
      nextActionAt: opportunity?.nextActionAt ?? null,
      nextActionLabel: form.nextActionLabel.trim() || null,
      lastInteractionAt: opportunity?.lastInteractionAt ?? now,
      timeline: opportunity?.timeline ?? [
        {
          id: uniqueId('evt'),
          type: 'criacao',
          title: 'Oportunidade criada',
          description: 'Registro criado manualmente no pipeline.',
          date: now,
          authorId: form.ownerId,
        },
      ],
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
      title={opportunity ? 'Editar oportunidade' : 'Nova oportunidade'}
      description={
        opportunity
          ? 'Atualize os dados do negócio em andamento.'
          : 'Registre um novo negócio no pipeline comercial.'
      }
      size="lg"
    >
      <form id="opportunity-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="O que está sendo vendido" htmlFor="opo-title" error={errors.title}>
          <Input
            id="opo-title"
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="Ex.: Implementação de agente de IA"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Empresa" htmlFor="opo-company">
            <Select
              id="opo-company"
              value={form.companyId}
              onChange={(event) => {
                const company = companies.find((item) => item.id === event.target.value)!
                setForm((current) => ({
                  ...current,
                  companyId: company.id,
                  contactId: company.contacts[0]!.id,
                }))
              }}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.tradeName}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Contato" htmlFor="opo-contact">
            <Select
              id="opo-contact"
              value={form.contactId}
              onChange={(event) => update('contactId', event.target.value)}
            >
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} — {contact.role}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Valor (R$)" htmlFor="opo-value" error={errors.value}>
            <Input
              id="opo-value"
              type="number"
              min={0}
              step={500}
              value={form.value}
              onChange={(event) => update('value', event.target.value)}
            />
          </Field>

          <Field label="Etapa" htmlFor="opo-stage">
            <Select
              id="opo-stage"
              value={form.stage}
              onChange={(event) => {
                const stage = event.target.value as PipelineStageId
                setForm((current) => ({
                  ...current,
                  stage,
                  probability: String(STAGE_BY_ID[stage].probability),
                }))
              }}
            >
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Probabilidade (%)" htmlFor="opo-probability">
            <Input
              id="opo-probability"
              type="number"
              min={0}
              max={100}
              value={form.probability}
              onChange={(event) => update('probability', event.target.value)}
            />
          </Field>

          <Field label="Prioridade" htmlFor="opo-priority">
            <Select
              id="opo-priority"
              value={form.priority}
              onChange={(event) => update('priority', event.target.value as Priority)}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Origem" htmlFor="opo-source">
            <Select
              id="opo-source"
              value={form.source}
              onChange={(event) => update('source', event.target.value as LeadSource)}
            >
              {LEAD_SOURCES.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Responsável" htmlFor="opo-owner">
            <Select
              id="opo-owner"
              value={form.ownerId}
              onChange={(event) => update('ownerId', event.target.value)}
            >
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Previsão de fechamento" htmlFor="opo-close">
            <Input
              id="opo-close"
              type="date"
              value={form.expectedCloseAt}
              onChange={(event) => update('expectedCloseAt', event.target.value)}
            />
          </Field>
        </div>

        <Field label="Próxima ação" htmlFor="opo-next" hint="Aparece no card do pipeline e no briefing matinal.">
          <Textarea
            id="opo-next"
            value={form.nextActionLabel}
            onChange={(event) => update('nextActionLabel', event.target.value)}
            placeholder="Ex.: Follow-up da proposta na quinta-feira"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {opportunity ? 'Salvar alterações' : 'Criar oportunidade'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function buildInitialState(
  opportunity: Opportunity | null,
  defaultStage: PipelineStageId,
  fallbackCompanyId: string,
  fallbackOwnerId: string,
): FormState {
  return {
    title: opportunity?.title ?? '',
    companyId: opportunity?.companyId ?? fallbackCompanyId,
    contactId: opportunity?.contactId ?? '',
    value: opportunity ? String(opportunity.value) : '10000',
    stage: opportunity?.stage ?? defaultStage,
    probability: String(opportunity?.probability ?? STAGE_BY_ID[defaultStage].probability),
    priority: opportunity?.priority ?? 'media',
    source: opportunity?.source ?? 'whatsapp',
    ownerId: opportunity?.ownerId ?? fallbackOwnerId,
    expectedCloseAt: toDateInput(opportunity?.expectedCloseAt ?? null),
    nextActionLabel: opportunity?.nextActionLabel ?? '',
  }
}
