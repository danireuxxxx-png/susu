import { Plus, Workflow } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ActivityForm } from '@/components/crm/activity-form'
import { FilterBar, FilterSelect } from '@/components/crm/filter-bar'
import { KanbanBoard } from '@/components/crm/kanban-board'
import { OpportunityDrawer } from '@/components/crm/opportunity-drawer'
import { OpportunityForm } from '@/components/crm/opportunity-form'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/dialog'
import { PageHeader } from '@/components/ui/page-header'
import { Segmented } from '@/components/ui/segmented'
import { SearchInput } from '@/components/ui/search-input'
import { Badge } from '@/components/ui/badge'
import { PriorityBadge, SourceBadge } from '@/components/ui/status-badge'
import { LEAD_SOURCES, PRIORITIES } from '@/constants/labels'
import { PIPELINE_STAGES, stageLabel } from '@/constants/pipeline'
import { useCrm, useCrmData } from '@/hooks/use-crm'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useToast } from '@/hooks/use-toast'
import { formatCompactCurrency, formatCurrency, formatDate, formatRelative } from '@/lib/format'
import { matches, sum } from '@/lib/utils'
import { memberName } from '@/mock/team'
import type { Activity, Opportunity, PipelineStageId } from '@/types'

type View = 'kanban' | 'lista'

const PERIOD_OPTIONS = [
  { value: '30', label: 'Fecham em 30 dias' },
  { value: '60', label: 'Fecham em 60 dias' },
  { value: '90', label: 'Fecham em 90 dias' },
]

export function PipelinePage() {
  const { opportunities, companies, team } = useCrmData()
  const { saveOpportunity, removeOpportunity, moveOpportunity, saveActivity } = useCrm()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [view, setView] = useState<View>('kanban')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  const [owner, setOwner] = useState('todos')
  const [stage, setStage] = useState('todos')
  const [source, setSource] = useState('todos')
  const [priority, setPriority] = useState('todos')
  const [period, setPeriod] = useState('todos')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Opportunity | null>(null)
  const [defaultStage, setDefaultStage] = useState<PipelineStageId>('novo-lead')
  const [activityOpen, setActivityOpen] = useState(false)
  const [activityContext, setActivityContext] = useState<Opportunity | null>(null)
  const [deleting, setDeleting] = useState<Opportunity | null>(null)

  const selectedId = searchParams.get('oportunidade')
  const selected = opportunities.find((item) => item.id === selectedId) ?? null

  const filtered = useMemo(() => {
    const limit = period === 'todos' ? null : Number(period)
    return opportunities.filter((item) => {
      if (owner !== 'todos' && item.ownerId !== owner) return false
      if (stage !== 'todos' && item.stage !== stage) return false
      if (source !== 'todos' && item.source !== source) return false
      if (priority !== 'todos' && item.priority !== priority) return false
      if (limit) {
        const days = (new Date(item.expectedCloseAt).getTime() - Date.now()) / 86_400_000
        if (days > limit) return false
      }
      return matches([item.companyName, item.title, item.contactName], debouncedQuery)
    })
  }, [opportunities, owner, stage, source, priority, period, debouncedQuery])

  const activeFilters = [owner, stage, source, priority, period].filter((value) => value !== 'todos').length
  const openItems = filtered.filter((item) => item.stage !== 'ganho' && item.stage !== 'perdido')

  function clearFilters() {
    setOwner('todos')
    setStage('todos')
    setSource('todos')
    setPriority('todos')
    setPeriod('todos')
    setQuery('')
  }

  function openDetails(opportunity: Opportunity) {
    setSearchParams({ oportunidade: opportunity.id })
  }

  function closeDetails() {
    searchParams.delete('oportunidade')
    setSearchParams(searchParams)
  }

  async function handleMove(id: string, nextStage: PipelineStageId) {
    await moveOpportunity(id, nextStage)
    const opportunity = opportunities.find((item) => item.id === id)
    toast({
      title: `Movido para ${stageLabel(nextStage)}`,
      description: opportunity ? `${opportunity.companyName} · ${formatCurrency(opportunity.value)}` : undefined,
      tone: nextStage === 'ganho' ? 'sucesso' : 'neutro',
    })
  }

  async function handleSave(opportunity: Opportunity) {
    await saveOpportunity(opportunity)
    toast({
      title: editing ? 'Oportunidade atualizada' : 'Oportunidade criada',
      description: `${opportunity.companyName} · ${formatCurrency(opportunity.value)}`,
      tone: 'sucesso',
    })
  }

  async function handleDelete(opportunity: Opportunity) {
    await removeOpportunity(opportunity.id)
    closeDetails()
    toast({ title: 'Oportunidade excluída', description: opportunity.companyName, tone: 'atencao' })
  }

  async function handleActivity(activity: Activity) {
    await saveActivity(activity)
    toast({ title: 'Atividade agendada', description: activity.title, tone: 'sucesso' })
  }

  const columns: Column<Opportunity>[] = [
    {
      id: 'empresa',
      header: 'Empresa',
      sortValue: (row) => row.companyName,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{row.companyName}</p>
          <p className="truncate text-[12px] text-fg-muted">{row.title}</p>
        </div>
      ),
    },
    {
      id: 'etapa',
      header: 'Etapa',
      sortValue: (row) => PIPELINE_STAGES.findIndex((stageItem) => stageItem.id === row.stage),
      cell: (row) => <Badge tone="destaque">{stageLabel(row.stage)}</Badge>,
    },
    {
      id: 'valor',
      header: 'Valor',
      align: 'right',
      sortValue: (row) => row.value,
      cell: (row) => <span className="font-medium">{formatCurrency(row.value)}</span>,
    },
    {
      id: 'probabilidade',
      header: 'Prob.',
      align: 'right',
      hideBelow: 'md',
      sortValue: (row) => row.probability,
      cell: (row) => `${row.probability}%`,
    },
    {
      id: 'prioridade',
      header: 'Prioridade',
      hideBelow: 'lg',
      cell: (row) => <PriorityBadge priority={row.priority} size="sm" />,
    },
    {
      id: 'origem',
      header: 'Origem',
      hideBelow: 'xl',
      cell: (row) => <SourceBadge source={row.source} size="sm" />,
    },
    {
      id: 'responsavel',
      header: 'Responsável',
      hideBelow: 'lg',
      sortValue: (row) => memberName(row.ownerId),
      cell: (row) => <span className="text-[13px] text-fg-muted">{memberName(row.ownerId)}</span>,
    },
    {
      id: 'fechamento',
      header: 'Previsão',
      hideBelow: 'md',
      sortValue: (row) => row.expectedCloseAt,
      cell: (row) => <span className="text-[13px] text-fg-muted">{formatDate(row.expectedCloseAt)}</span>,
    },
    {
      id: 'interacao',
      header: 'Última interação',
      hideBelow: 'xl',
      sortValue: (row) => row.lastInteractionAt,
      cell: (row) => <span className="text-[13px] text-fg-muted">{formatRelative(row.lastInteractionAt)}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pipeline"
        description={`${openItems.length} oportunidades em aberto · ${formatCompactCurrency(
          sum(openItems, (item) => item.value),
        )} em jogo`}
        actions={
          <>
            <Segmented
              ariaLabel="Visualização do pipeline"
              options={[
                { value: 'kanban' as const, label: 'Kanban' },
                { value: 'lista' as const, label: 'Lista' },
              ]}
              value={view}
              onChange={setView}
            />
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null)
                setDefaultStage('novo-lead')
                setFormOpen(true)
              }}
            >
              <Plus aria-hidden />
              Nova oportunidade
            </Button>
          </>
        }
      />

      <FilterBar activeCount={activeFilters} onClear={clearFilters}>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar empresa, contato ou solução"
          className="w-full sm:w-72"
        />
        <FilterSelect
          label="Responsável"
          value={owner}
          onChange={setOwner}
          options={team.map((member) => ({ value: member.id, label: member.name }))}
        />
        <FilterSelect
          label="Etapa"
          value={stage}
          onChange={setStage}
          options={PIPELINE_STAGES.map((item) => ({ value: item.id, label: item.label }))}
        />
        <FilterSelect
          label="Origem"
          value={source}
          onChange={setSource}
          options={LEAD_SOURCES.map((item) => ({ value: item.id, label: item.label }))}
        />
        <FilterSelect
          label="Prioridade"
          value={priority}
          onChange={setPriority}
          options={PRIORITIES.map((item) => ({ value: item.id, label: item.label }))}
        />
        <FilterSelect label="Período" value={period} onChange={setPeriod} options={PERIOD_OPTIONS} />
      </FilterBar>

      {view === 'kanban' ? (
        <KanbanBoard
          opportunities={filtered}
          onMove={handleMove}
          onOpen={openDetails}
          onCreate={(stageId) => {
            setEditing(null)
            setDefaultStage(stageId)
            setFormOpen(true)
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(row) => row.id}
          onRowClick={openDetails}
          emptyIcon={Workflow}
          emptyTitle="Nenhuma oportunidade encontrada"
          emptyDescription="Ajuste os filtros ou crie uma nova oportunidade."
          emptyAction={
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              <Plus aria-hidden />
              Nova oportunidade
            </Button>
          }
          initialSort={{ columnId: 'valor', direction: 'desc' }}
        />
      )}

      <OpportunityDrawer
        opportunity={selected}
        company={companies.find((company) => company.id === selected?.companyId)}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && closeDetails()}
        onEdit={(opportunity) => {
          setEditing(opportunity)
          setFormOpen(true)
        }}
        onDelete={(opportunity) => setDeleting(opportunity)}
        onMove={handleMove}
        onAddActivity={(opportunity) => {
          setActivityContext(opportunity)
          setActivityOpen(true)
        }}
        onMessage={(opportunity) =>
          toast({
            title: 'Envio de mensagem em breve',
            description: `A integração com o WhatsApp vai disparar a mensagem para ${opportunity.contactName}.`,
            tone: 'neutro',
          })
        }
      />

      <OpportunityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        opportunity={editing}
        defaultStage={defaultStage}
        onSubmit={handleSave}
      />

      <ActivityForm
        open={activityOpen}
        onOpenChange={setActivityOpen}
        activity={null}
        context={
          activityContext
            ? {
                companyId: activityContext.companyId,
                companyName: activityContext.companyName,
                opportunityId: activityContext.id,
              }
            : undefined
        }
        onSubmit={handleActivity}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir oportunidade"
        description={deleting ? `${deleting.companyName} · ${formatCurrency(deleting.value)}` : ''}
        onConfirm={() => deleting && handleDelete(deleting)}
      />

      {view === 'lista' ? (
        <p className="text-[12px] text-fg-subtle">
          Dica: na visão Kanban você pode arrastar os cards entre as etapas.
        </p>
      ) : null}
    </div>
  )
}
