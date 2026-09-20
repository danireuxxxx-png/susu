import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { LEAD_SOURCES, LEAD_STATUSES } from '@/constants/labels'
import { useCrmData } from '@/hooks/use-crm'
import { uniqueId } from '@/lib/utils'
import type { Lead, LeadSource, LeadStatus } from '@/types'

interface LeadFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onSubmit: (lead: Lead) => Promise<void> | void
}

interface FormState {
  name: string
  companyId: string
  role: string
  email: string
  whatsapp: string
  source: LeadSource
  status: LeadStatus
  potentialValue: string
  ownerId: string
  notes: string
}

export function LeadForm({ open, onOpenChange, lead, onSubmit }: LeadFormProps) {
  const { companies, team } = useCrmData()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<FormState>(() => buildInitialState(lead, companies[0]!.id, team[0]!.id))

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(lead, companies[0]!.id, team[0]!.id))
      setErrors({})
    }
  }, [open, lead, companies, team])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = 'Informe o nome do lead.'
    if (form.email && !form.email.includes('@')) nextErrors.email = 'E-mail inválido.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const company = companies.find((item) => item.id === form.companyId)!
    const now = new Date().toISOString()

    const payload: Lead = {
      id: lead?.id ?? uniqueId('lead'),
      name: form.name.trim(),
      companyId: company.id,
      companyName: company.tradeName,
      role: form.role.trim() || 'Não informado',
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim(),
      source: form.source,
      status: form.status,
      potentialValue: Number(form.potentialValue) || 0,
      ownerId: form.ownerId,
      createdAt: lead?.createdAt ?? now,
      lastInteractionAt: now,
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
      title={lead ? 'Editar lead' : 'Novo lead'}
      description={
        lead ? 'Atualize as informações do contato.' : 'Cadastre um contato que ainda não virou oportunidade.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="lead-name" error={errors.name}>
            <Input
              id="lead-name"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Ex.: Joana Martins"
            />
          </Field>

          <Field label="Empresa" htmlFor="lead-company">
            <Select
              id="lead-company"
              value={form.companyId}
              onChange={(event) => update('companyId', event.target.value)}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.tradeName}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Cargo" htmlFor="lead-role">
            <Input
              id="lead-role"
              value={form.role}
              onChange={(event) => update('role', event.target.value)}
              placeholder="Ex.: Diretora Comercial"
            />
          </Field>

          <Field label="E-mail" htmlFor="lead-email" error={errors.email}>
            <Input
              id="lead-email"
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="nome@empresa.com.br"
            />
          </Field>

          <Field label="WhatsApp" htmlFor="lead-phone">
            <Input
              id="lead-phone"
              value={form.whatsapp}
              onChange={(event) => update('whatsapp', event.target.value)}
              placeholder="+55 (11) 90000-0000"
            />
          </Field>

          <Field label="Valor potencial (R$)" htmlFor="lead-value">
            <Input
              id="lead-value"
              type="number"
              min={0}
              step={500}
              value={form.potentialValue}
              onChange={(event) => update('potentialValue', event.target.value)}
            />
          </Field>

          <Field label="Origem" htmlFor="lead-source">
            <Select
              id="lead-source"
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

          <Field label="Status" htmlFor="lead-status">
            <Select
              id="lead-status"
              value={form.status}
              onChange={(event) => update('status', event.target.value as LeadStatus)}
            >
              {LEAD_STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Responsável" htmlFor="lead-owner" className="sm:col-span-2">
            <Select
              id="lead-owner"
              value={form.ownerId}
              onChange={(event) => update('ownerId', event.target.value)}
            >
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} — {member.role}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Observações" htmlFor="lead-notes">
          <Textarea
            id="lead-notes"
            value={form.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="Contexto do primeiro contato, necessidade, prazo..."
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {lead ? 'Salvar alterações' : 'Criar lead'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function buildInitialState(lead: Lead | null, fallbackCompanyId: string, fallbackOwnerId: string): FormState {
  return {
    name: lead?.name ?? '',
    companyId: lead?.companyId ?? fallbackCompanyId,
    role: lead?.role ?? '',
    email: lead?.email ?? '',
    whatsapp: lead?.whatsapp ?? '',
    source: lead?.source ?? 'whatsapp',
    status: lead?.status ?? 'novo',
    potentialValue: lead ? String(lead.potentialValue) : '8000',
    ownerId: lead?.ownerId ?? fallbackOwnerId,
    notes: lead?.notes ?? '',
  }
}
