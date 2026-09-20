import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { BILLING_PERIODS, COST_CATEGORIES, COST_TYPES } from '@/constants/costs'
import type { CostInput } from '@/services/economics.service'
import type { ProjectCostLine } from '@/types'

interface CostFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  cost: ProjectCostLine | null
  onSubmit: (input: CostInput) => Promise<void>
}

const PROVIDERS = [
  'OpenAI',
  'Anthropic',
  'Google',
  'AWS',
  'Vercel',
  'Supabase',
  'Cloudflare',
  'Twilio',
  'Meta',
  'DigitalOcean',
  'Hetzner',
  'Resend',
]

export function CostForm({ open, onOpenChange, projectId, cost, onSubmit }: CostFormProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => initialState(cost))

  useEffect(() => {
    if (open) {
      setForm(initialState(cost))
      setError('')
    }
  }, [open, cost])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Dê um nome ao custo.')
      return
    }

    setSaving(true)
    try {
      await onSubmit({
        id: cost?.id,
        projectId,
        name: form.name.trim(),
        category: form.category,
        provider: form.provider,
        costType: form.costType,
        amount: Number(form.amount) || 0,
        billingPeriod: form.billingPeriod,
        description: form.description,
      })
      onOpenChange(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o custo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={cost ? 'Editar custo' : 'Novo custo'}
      description="O valor é normalizado para a base mensal conforme o período de cobrança."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome do custo" htmlFor="cost-name" error={error}>
          <Input
            id="cost-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ex.: OpenAI — GPT"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria" htmlFor="cost-category">
            <Select
              id="cost-category"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value as CostInput['category'] }))
              }
            >
              {COST_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Fornecedor" htmlFor="cost-provider" hint="Usado para somar o gasto por provedor.">
            <Input
              id="cost-provider"
              list="cost-providers"
              value={form.provider}
              onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
              placeholder="Ex.: OpenAI"
            />
            <datalist id="cost-providers">
              {PROVIDERS.map((provider) => (
                <option key={provider} value={provider} />
              ))}
            </datalist>
          </Field>

          <Field label="Valor (R$)" htmlFor="cost-amount">
            <Input
              id="cost-amount"
              type="number"
              min={0}
              step={10}
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            />
          </Field>

          <Field label="Período de cobrança" htmlFor="cost-period">
            <Select
              id="cost-period"
              value={form.billingPeriod}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  billingPeriod: event.target.value as CostInput['billingPeriod'],
                }))
              }
            >
              {BILLING_PERIODS.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Tipo"
            htmlFor="cost-type"
            className="sm:col-span-2"
            hint="Por consumo: o valor varia com o uso (tokens, mensagens)."
          >
            <Select
              id="cost-type"
              value={form.costType}
              onChange={(event) =>
                setForm((current) => ({ ...current, costType: event.target.value as CostInput['costType'] }))
              }
            >
              {COST_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Observações" htmlFor="cost-notes">
          <Textarea
            id="cost-notes"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Plano contratado, limites, contexto da cobrança..."
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {cost ? 'Salvar custo' : 'Adicionar custo'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function initialState(cost: ProjectCostLine | null) {
  return {
    name: cost?.name ?? '',
    category: (cost?.category ?? 'AI_API') as CostInput['category'],
    provider: cost?.provider ?? '',
    costType: (cost?.costType ?? 'FIXED') as CostInput['costType'],
    amount: String(cost?.amount ?? 100),
    billingPeriod: (cost?.billingPeriod ?? 'MONTHLY') as CostInput['billingPeriod'],
    description: cost?.description ?? '',
  }
}
