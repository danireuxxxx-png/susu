import * as Tabs from '@radix-ui/react-tabs'
import {
  ArrowRightLeft,
  Building2,
  CalendarPlus,
  ExternalLink,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSectionLabel,
  DropdownTrigger,
} from '@/components/ui/dropdown'
import { ProgressBar } from '@/components/ui/progress'
import { PriorityBadge, SourceBadge } from '@/components/ui/status-badge'
import { PIPELINE_STAGES, stageLabel } from '@/constants/pipeline'
import { formatCurrency, formatDate, formatFriendlyDateTime, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { memberName } from '@/mock/team'
import type { Company, Opportunity, PipelineStageId } from '@/types'
import { ClientIntelligence } from './client-intelligence'
import { Timeline } from './timeline'

interface OpportunityDrawerProps {
  opportunity: Opportunity | null
  company: Company | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (opportunity: Opportunity) => void
  onDelete: (opportunity: Opportunity) => void
  onMove: (id: string, stage: PipelineStageId) => void
  onAddActivity: (opportunity: Opportunity) => void
  onMessage: (opportunity: Opportunity) => void
}

const TAB_TRIGGER = cn(
  'relative px-1 pb-2.5 text-[13px] font-medium text-fg-muted transition-colors duration-150',
  'hover:text-fg data-[state=active]:text-fg',
  'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent',
  'data-[state=active]:after:bg-accent',
)

export function OpportunityDrawer({
  opportunity,
  company,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onMove,
  onAddActivity,
  onMessage,
}: OpportunityDrawerProps) {
  if (!opportunity) return null

  const contact = company?.contacts.find((item) => item.id === opportunity.contactId) ?? company?.contacts[0]

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={opportunity.companyName}
      description={opportunity.title}
      footer={
        <>
          <Button variant="primary" size="sm" onClick={() => onEdit(opportunity)}>
            <Pencil aria-hidden />
            Editar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onAddActivity(opportunity)}>
            <CalendarPlus aria-hidden />
            Adicionar atividade
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onMessage(opportunity)}>
            <MessageSquare aria-hidden />
            Enviar mensagem
          </Button>
          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="secondary" size="sm">
                <ArrowRightLeft aria-hidden />
                Mover etapa
              </Button>
            </DropdownTrigger>
            <DropdownContent align="start">
              <DropdownSectionLabel>Mover para</DropdownSectionLabel>
              {PIPELINE_STAGES.filter((stage) => stage.id !== opportunity.stage).map((stage) => (
                <DropdownItem key={stage.id} onSelect={() => onMove(opportunity.id, stage.id)}>
                  {stage.label}
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-critical hover:bg-critical-soft hover:text-critical"
            onClick={() => onDelete(opportunity)}
          >
            <Trash2 aria-hidden />
            Excluir
          </Button>
        </>
      }
    >
      <div className="space-y-6 px-5 py-5">
        {/* Resumo do negocio */}
        <section className="rounded-xl border border-line bg-surface-muted p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-fg-subtle">Valor da oportunidade</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-fg tabular">
                {formatCurrency(opportunity.value)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="destaque">{stageLabel(opportunity.stage)}</Badge>
              <PriorityBadge priority={opportunity.priority} />
              <SourceBadge source={opportunity.source} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px] text-fg-muted">
              <span>Probabilidade de fechamento</span>
              <span className="font-medium text-fg tabular">{opportunity.probability}%</span>
            </div>
            <ProgressBar value={opportunity.probability} className="mt-1.5" label="Probabilidade" />
          </div>

          {opportunity.nextActionLabel ? (
            <div className="mt-4 rounded-lg border border-line bg-surface p-3">
              <p className="text-[11px] uppercase tracking-wide text-fg-subtle">Próxima ação</p>
              <p className="mt-1 text-[13px] font-medium text-fg">{opportunity.nextActionLabel}</p>
              {opportunity.nextActionAt ? (
                <p className="mt-0.5 text-[12px] text-fg-muted">
                  {formatFriendlyDateTime(opportunity.nextActionAt)}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <Tabs.Root defaultValue="visao-geral">
          <Tabs.List className="flex gap-5 border-b border-line">
            <Tabs.Trigger value="visao-geral" className={TAB_TRIGGER}>
              Visão geral
            </Tabs.Trigger>
            <Tabs.Trigger value="timeline" className={TAB_TRIGGER}>
              Timeline
            </Tabs.Trigger>
            <Tabs.Trigger value="inteligencia" className={TAB_TRIGGER}>
              Inteligência
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="visao-geral" className="pt-5 focus:outline-none">
            <div className="space-y-5">
              <DetailBlock title="Empresa">
                <DetailRow label="Nome fantasia" value={company?.tradeName ?? opportunity.companyName} />
                <DetailRow label="Razão social" value={company?.legalName ?? '—'} />
                <DetailRow label="CNPJ" value={company?.cnpj ?? '—'} />
                <DetailRow label="Segmento" value={company?.segment ?? '—'} />
                <DetailRow label="Funcionários" value={company ? String(company.employees) : '—'} />
                <DetailRow label="Site" value={company?.website ?? '—'} />
              </DetailBlock>

              <DetailBlock title="Contato">
                <DetailRow label="Nome" value={contact?.name ?? opportunity.contactName} />
                <DetailRow label="Cargo" value={contact?.role ?? '—'} />
                <DetailRow label="WhatsApp" value={contact?.whatsapp ?? '—'} />
                <DetailRow label="E-mail" value={contact?.email ?? '—'} />
              </DetailBlock>

              <DetailBlock title="Negócio">
                <DetailRow label="Responsável" value={memberName(opportunity.ownerId)} />
                <DetailRow label="Criada em" value={formatDate(opportunity.createdAt)} />
                <DetailRow label="Previsão de fechamento" value={formatDate(opportunity.expectedCloseAt)} />
                <DetailRow label="Última interação" value={formatRelative(opportunity.lastInteractionAt)} />
              </DetailBlock>

              <div className="flex flex-wrap gap-2">
                {contact?.whatsapp ? (
                  <Button variant="secondary" size="sm" onClick={() => onMessage(opportunity)}>
                    <Phone aria-hidden />
                    {contact.whatsapp}
                  </Button>
                ) : null}
                {contact?.email ? (
                  <Button variant="secondary" size="sm" onClick={() => onMessage(opportunity)}>
                    <Mail aria-hidden />
                    {contact.email}
                  </Button>
                ) : null}
                {company ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/empresas/${company.id}`}>
                      <Building2 aria-hidden />
                      Ver ficha da empresa
                      <ExternalLink aria-hidden />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="timeline" className="pt-5 focus:outline-none">
            <Timeline events={opportunity.timeline} />
          </Tabs.Content>

          <Tabs.Content value="inteligencia" className="pt-5 focus:outline-none">
            {company?.intelligence && contact ? (
              <ClientIntelligence
                data={company.intelligence}
                contactName={contact.name}
                contactRole={contact.role}
                companyName={company.tradeName}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-fg-muted">
                O agente de IA ainda não captou dados estruturados desta conta.
              </p>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </Drawer>
  )
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-[13px] font-semibold text-fg">{title}</h4>
      <dl className="mt-2 divide-y divide-line rounded-xl border border-line">{children}</dl>
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3.5 py-2.5">
      <dt className="text-[12px] text-fg-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] font-medium text-fg">{value}</dd>
    </div>
  )
}
