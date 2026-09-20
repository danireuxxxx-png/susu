import { Contact2, MoreHorizontal, Pencil, Plus, Trash2, Workflow } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterBar, FilterSelect } from '@/components/crm/filter-bar'
import { LeadForm } from '@/components/crm/lead-form'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/dialog'
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '@/components/ui/dropdown'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { Segmented } from '@/components/ui/segmented'
import { LeadStatusBadge, SourceBadge } from '@/components/ui/status-badge'
import { LEAD_SOURCES } from '@/constants/labels'
import { useCrm, useCrmData } from '@/hooks/use-crm'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, formatRelative } from '@/lib/format'
import { matches } from '@/lib/utils'
import { memberName } from '@/mock/team'
import type { Lead, LeadStatus } from '@/types'

type StatusTab = 'todos' | LeadStatus

const TABS: { value: StatusTab; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'novo', label: 'Novos' },
  { value: 'em-qualificacao', label: 'Em qualificação' },
  { value: 'qualificado', label: 'Qualificados' },
  { value: 'sem-contato', label: 'Sem contato' },
  { value: 'convertido', label: 'Convertidos' },
]

export function LeadsPage() {
  const { leads, team } = useCrmData()
  const { saveLead, removeLead } = useCrm()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [tab, setTab] = useState<StatusTab>('todos')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  const [source, setSource] = useState('todos')
  const [owner, setOwner] = useState('todos')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [deleting, setDeleting] = useState<Lead | null>(null)

  const highlightedId = searchParams.get('lead')

  const filtered = useMemo(
    () =>
      leads.filter((lead) => {
        if (tab !== 'todos' && lead.status !== tab) return false
        if (source !== 'todos' && lead.source !== source) return false
        if (owner !== 'todos' && lead.ownerId !== owner) return false
        if (highlightedId && lead.id === highlightedId) return true
        return matches([lead.name, lead.companyName, lead.email, lead.role], debouncedQuery)
      }),
    [leads, tab, source, owner, debouncedQuery, highlightedId],
  )

  const activeFilters = [source, owner].filter((value) => value !== 'todos').length

  function openEdit(lead: Lead) {
    setEditing(lead)
    setFormOpen(true)
  }

  async function handleSave(lead: Lead) {
    const isNew = !leads.some((item) => item.id === lead.id)
    await saveLead(lead)
    toast({
      title: isNew ? 'Lead criado' : 'Lead atualizado',
      description: `${lead.name} · ${lead.companyName}`,
      tone: 'sucesso',
    })
  }

  async function handleDelete(lead: Lead) {
    await removeLead(lead.id)
    toast({ title: 'Lead excluído', description: lead.name, tone: 'atencao' })
  }

  const columns: Column<Lead>[] = [
    {
      id: 'nome',
      header: 'Lead',
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={row.name} size="sm" color="blue" />
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">{row.name}</p>
            <p className="truncate text-[12px] text-fg-muted">{row.role}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'empresa',
      header: 'Empresa',
      sortValue: (row) => row.companyName,
      cell: (row) => <span className="text-[13px] text-fg">{row.companyName}</span>,
    },
    {
      id: 'origem',
      header: 'Origem',
      hideBelow: 'md',
      cell: (row) => <SourceBadge source={row.source} size="sm" />,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <LeadStatusBadge status={row.status} size="sm" />,
    },
    {
      id: 'valor',
      header: 'Valor potencial',
      align: 'right',
      sortValue: (row) => row.potentialValue,
      cell: (row) => <span className="font-medium">{formatCurrency(row.potentialValue)}</span>,
    },
    {
      id: 'interacao',
      header: 'Última interação',
      hideBelow: 'lg',
      sortValue: (row) => row.lastInteractionAt,
      cell: (row) => <span className="text-[13px] text-fg-muted">{formatRelative(row.lastInteractionAt)}</span>,
    },
    {
      id: 'responsavel',
      header: 'Responsável',
      hideBelow: 'xl',
      sortValue: (row) => memberName(row.ownerId),
      cell: (row) => <span className="text-[13px] text-fg-muted">{memberName(row.ownerId)}</span>,
    },
    {
      id: 'entrada',
      header: 'Entrada',
      hideBelow: 'xl',
      sortValue: (row) => row.createdAt,
      cell: (row) => <span className="text-[13px] text-fg-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      id: 'acoes',
      header: '',
      width: '48px',
      cell: (row) => (
        <Dropdown>
          <DropdownTrigger asChild>
            <button
              type="button"
              aria-label={`Ações de ${row.name}`}
              onClick={(event) => event.stopPropagation()}
              className="grid size-7 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownItem onSelect={() => openEdit(row)}>
              <Pencil aria-hidden />
              Editar lead
            </DropdownItem>
            <DropdownItem
              onSelect={() =>
                toast({
                  title: 'Conversão em oportunidade',
                  description: `${row.name} entra no pipeline quando o backend estiver conectado.`,
                  tone: 'neutro',
                })
              }
            >
              <Workflow aria-hidden />
              Converter em oportunidade
            </DropdownItem>
            <DropdownItem destructive onSelect={() => setDeleting(row)}>
              <Trash2 aria-hidden />
              Excluir
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads"
        description={`${filtered.length} de ${leads.length} contatos na base`}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus aria-hidden />
            Novo lead
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          ariaLabel="Filtrar leads por status"
          options={TABS}
          value={tab}
          onChange={(value) => {
            setTab(value)
            if (highlightedId) {
              searchParams.delete('lead')
              setSearchParams(searchParams)
            }
          }}
        />
      </div>

      <FilterBar
        activeCount={activeFilters}
        onClear={() => {
          setSource('todos')
          setOwner('todos')
          setQuery('')
        }}
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nome, empresa ou e-mail"
          className="w-full sm:w-72"
        />
        <FilterSelect
          label="Origem"
          value={source}
          onChange={setSource}
          options={LEAD_SOURCES.map((item) => ({ value: item.id, label: item.label }))}
        />
        <FilterSelect
          label="Responsável"
          value={owner}
          onChange={setOwner}
          options={team.map((member) => ({ value: member.id, label: member.name }))}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.id}
        onRowClick={openEdit}
        emptyIcon={Contact2}
        emptyTitle="Nenhum lead encontrado"
        emptyDescription="Ajuste os filtros ou cadastre um novo contato."
        emptyAction={
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <Plus aria-hidden />
            Novo lead
          </Button>
        }
        initialSort={{ columnId: 'interacao', direction: 'desc' }}
      />

      <LeadForm open={formOpen} onOpenChange={setFormOpen} lead={editing} onSubmit={handleSave} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir lead"
        description={deleting ? `${deleting.name} · ${deleting.companyName}` : ''}
        onConfirm={() => deleting && handleDelete(deleting)}
      />
    </div>
  )
}
