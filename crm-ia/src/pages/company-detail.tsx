import * as Tabs from '@radix-ui/react-tabs'
import { ArrowLeft, Building2, Globe, Mail, MapPin, MessageSquare, Phone, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClientIntelligence } from '@/components/crm/client-intelligence'
import { Timeline } from '@/components/crm/timeline'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import { CustomerStatusBadge, PriorityBadge } from '@/components/ui/status-badge'
import { COMPANY_SIZE_BY_ID } from '@/constants/labels'
import { stageLabel } from '@/constants/pipeline'
import { useCrmData } from '@/hooks/use-crm'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { NotFoundPage } from './not-found'

const TAB_TRIGGER = cn(
  'relative px-1 pb-2.5 text-[13px] font-medium text-fg-muted transition-colors duration-150',
  'hover:text-fg data-[state=active]:text-fg',
  'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent',
  'data-[state=active]:after:bg-accent',
)

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { companies, customers, opportunities, activities } = useCrmData()
  const { toast } = useToast()

  const company = companies.find((item) => item.id === id)
  const customer = customers.find((item) => item.companyId === id)

  const companyOpportunities = useMemo(
    () => opportunities.filter((item) => item.companyId === id),
    [opportunities, id],
  )

  const timeline = useMemo(() => {
    const fromOpportunities = companyOpportunities.flatMap((opportunity) => opportunity.timeline)
    const fromActivities = activities
      .filter((activity) => activity.companyId === id && activity.done)
      .map((activity) => ({
        id: `atv-${activity.id}`,
        type: activity.type,
        title: activity.title,
        description: activity.notes,
        date: activity.scheduledAt,
        authorId: activity.ownerId,
      }))
    return [...fromOpportunities, ...fromActivities]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 24)
  }, [companyOpportunities, activities, id])

  if (!company) return <NotFoundPage />

  const openValue = companyOpportunities
    .filter((item) => item.stage !== 'ganho' && item.stage !== 'perdido')
    .reduce((total, item) => total + item.value, 0)

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/empresas">
          <ArrowLeft aria-hidden />
          Voltar para empresas
        </Link>
      </Button>

      <PageHeader
        title={company.tradeName}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3.5" aria-hidden />
              {company.legalName}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden />
              {company.city}/{company.state}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="size-3.5" aria-hidden />
              {company.website}
            </span>
          </span>
        }
        actions={
          <>
            {customer ? <CustomerStatusBadge status={customer.status} /> : <Badge tone="neutro" dot>Prospect</Badge>}
            <Button
              variant="secondary"
              onClick={() =>
                toast({
                  title: 'Mensagem em breve',
                  description: 'O disparo pelo WhatsApp entra com a integração oficial.',
                  tone: 'neutro',
                })
              }
            >
              <MessageSquare aria-hidden />
              Enviar mensagem
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="MRR" value={company.mrr ? formatCurrency(company.mrr) : '—'} footer={company.contract ?? 'Sem contrato ativo'} />
        <KpiCard label="Ticket médio" value={company.ticket ? formatCurrency(company.ticket) : '—'} footer="Média dos projetos fechados" />
        <KpiCard label="Total vendido" value={company.totalSold ? formatCurrency(company.totalSold) : '—'} footer="Recorrência + projetos" />
        <KpiCard label="Em aberto" value={openValue ? formatCurrency(openValue) : '—'} footer={`${companyOpportunities.length} negócios no histórico`} />
      </section>

      <Tabs.Root defaultValue="geral">
        <Tabs.List className="flex gap-5 overflow-x-auto border-b border-line scrollbar-thin">
          <Tabs.Trigger value="geral" className={TAB_TRIGGER}>
            Informações gerais
          </Tabs.Trigger>
          <Tabs.Trigger value="contatos" className={TAB_TRIGGER}>
            Contatos
          </Tabs.Trigger>
          <Tabs.Trigger value="negocios" className={TAB_TRIGGER}>
            Negócios
          </Tabs.Trigger>
          <Tabs.Trigger value="historico" className={TAB_TRIGGER}>
            Histórico
          </Tabs.Trigger>
          <Tabs.Trigger value="inteligencia" className={TAB_TRIGGER}>
            Inteligência do cliente
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="geral" className="pt-5 focus:outline-none">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Dados cadastrais" />
              <CardBody className="pt-0">
                <dl className="divide-y divide-line">
                  <Row label="Razão social" value={company.legalName} />
                  <Row label="Nome fantasia" value={company.tradeName} />
                  <Row label="CNPJ" value={company.cnpj} />
                  <Row label="Segmento" value={company.segment} />
                  <Row label="Porte" value={COMPANY_SIZE_BY_ID[company.size].label} />
                  <Row label="Colaboradores" value={formatNumber(company.employees)} />
                  <Row label="Cidade" value={`${company.city}/${company.state}`} />
                  <Row label="Website" value={company.website} />
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Dados comerciais" />
              <CardBody className="pt-0">
                <dl className="divide-y divide-line">
                  <Row label="Contrato" value={company.contract ?? 'Sem contrato ativo'} />
                  <Row label="MRR" value={company.mrr ? formatCurrency(company.mrr) : '—'} />
                  <Row label="Ticket médio" value={company.ticket ? formatCurrency(company.ticket) : '—'} />
                  <Row label="Total vendido" value={company.totalSold ? formatCurrency(company.totalSold) : '—'} />
                  <Row label="Cliente desde" value={customer ? formatDate(customer.startedAt) : '—'} />
                  <Row label="Próxima renovação" value={customer ? formatDate(customer.renewalAt) : '—'} />
                  <Row label="Plano" value={customer?.plan ?? '—'} />
                  <Row label="LTV" value={customer ? formatCurrency(customer.ltv) : '—'} />
                </dl>
              </CardBody>
            </Card>
          </div>
        </Tabs.Content>

        <Tabs.Content value="contatos" className="pt-5 focus:outline-none">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {company.contacts.map((contact) => (
              <article key={contact.id} className="rounded-card border border-line bg-surface p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={contact.name} size="md" color="blue" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg">{contact.name}</p>
                    <p className="truncate text-[12px] text-fg-muted">{contact.role}</p>
                  </div>
                  {contact.isPrimary ? (
                    <Badge tone="destaque" size="sm" className="ml-auto">
                      Principal
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3 space-y-1.5 text-[12px] text-fg-muted">
                  <p className="flex items-center gap-2">
                    <Mail className="size-3" aria-hidden />
                    <span className="truncate">{contact.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-3" aria-hidden />
                    {contact.whatsapp}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="negocios" className="pt-5 focus:outline-none">
          {companyOpportunities.length ? (
            <ul className="divide-y divide-line rounded-card border border-line bg-surface">
              {companyOpportunities.map((opportunity) => (
                <li key={opportunity.id}>
                  <Link
                    to={`/pipeline?oportunidade=${opportunity.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-fg">{opportunity.title}</p>
                      <p className="truncate text-[12px] text-fg-muted">
                        {stageLabel(opportunity.stage)} · previsão {formatDate(opportunity.expectedCloseAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <PriorityBadge priority={opportunity.priority} size="sm" />
                      <span className="text-[13px] font-semibold text-fg tabular">
                        {formatCurrency(opportunity.value)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-card border border-line bg-surface">
              <EmptyState icon={Building2} title="Nenhum negócio registrado" description="Esta empresa ainda não entrou no pipeline." />
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="historico" className="pt-5 focus:outline-none">
          {timeline.length ? (
            <Card>
              <CardBody className="pt-5">
                <Timeline events={timeline} />
              </CardBody>
            </Card>
          ) : (
            <div className="rounded-card border border-line bg-surface">
              <EmptyState icon={Building2} title="Sem histórico" description="Nenhuma interação registrada até agora." />
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="inteligencia" className="pt-5 focus:outline-none">
          <Card>
            <CardHeader
              title="Inteligência do cliente"
              description="Dados estruturados a partir das conversas — hoje simulados, amanhã preenchidos pelo agente de WhatsApp."
            />
            <CardBody>
              {company.intelligence ? (
                <ClientIntelligence
                  data={company.intelligence}
                  contactName={company.contacts[0]!.name}
                  contactRole={company.contacts[0]!.role}
                  companyName={company.tradeName}
                />
              ) : (
                <EmptyState
                  compact
                  icon={Sparkles}
                  title="Nada captado ainda"
                  description="Assim que houver conversa no WhatsApp, o agente preenche este perfil automaticamente."
                />
              )}
            </CardBody>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[12px] text-fg-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] font-medium text-fg">{value}</dd>
    </div>
  )
}
