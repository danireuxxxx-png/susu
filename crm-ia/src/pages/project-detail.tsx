import {
  ArrowLeft,
  CircleDollarSign,
  MoreHorizontal,
  Pencil,
  Percent,
  Plus,
  Receipt,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CostBreakdownChart } from '@/components/charts/cost-breakdown-chart'
import { CostForm } from '@/components/crm/cost-form'
import { MarginIndicator } from '@/components/crm/margin-indicator'
import { PageSkeleton } from '@/components/layout/page-skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ChartCard } from '@/components/ui/chart-card'
import { ConfirmDialog } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/ui/data-table'
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '@/components/ui/dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import {
  BILLING_PERIOD_LABEL,
  COST_CATEGORY_LABEL,
  COST_TYPE_BY_ID,
  PROJECT_STATUS_BY_ID,
} from '@/constants/costs'
import { useAsync } from '@/hooks/use-async'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatPercent } from '@/lib/format'
import { economicsService, type CostInput } from '@/services/economics.service'
import type { CostBreakdownRow, ProjectCostLine } from '@/types'
import { NotFoundPage } from './not-found'

/**
 * Ficha de rentabilidade do projeto.
 *
 * Responde, para uma entrega específica: quanto ela fatura, quanto custa
 * manter, quanto sobra — e qual linha de custo pesa mais.
 */
export function ProjectDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { toast } = useToast()
  const { data: project, loading, error, reload } = useAsync(() => economicsService.getProject(id), [id])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectCostLine | null>(null)
  const [deleting, setDeleting] = useState<ProjectCostLine | null>(null)

  const byCategory = useMemo<CostBreakdownRow[]>(() => {
    if (!project) return []
    const map = new Map<string, CostBreakdownRow>()

    for (const cost of project.costs) {
      const current = map.get(cost.category) ?? {
        key: cost.category,
        label: COST_CATEGORY_LABEL[cost.category] ?? cost.category,
        scope: 'PROJECT' as const,
        entries: 0,
        monthlyAmount: 0,
      }
      current.entries += 1
      current.monthlyAmount += cost.monthlyAmount
      map.set(cost.category, current)
    }

    return [...map.values()].sort((a, b) => b.monthlyAmount - a.monthlyAmount)
  }, [project])

  async function handleSave(input: CostInput) {
    await economicsService.saveCost(input)
    toast({
      title: input.id ? 'Custo atualizado' : 'Custo adicionado',
      description: `${input.name} · ${formatCurrency(input.amount)}`,
      tone: 'sucesso',
    })
    reload()
  }

  async function handleDelete(cost: ProjectCostLine) {
    await economicsService.deleteCost(cost.id)
    toast({ title: 'Custo removido', description: cost.name, tone: 'atencao' })
    reload()
  }

  if (loading) return <PageSkeleton />
  if (error) {
    return (
      <p className="rounded-card border border-line bg-critical-soft px-4 py-3 text-[13px] text-critical">
        {error}
      </p>
    )
  }
  if (!project) return <NotFoundPage />

  const status = PROJECT_STATUS_BY_ID[project.status]

  const columns: Column<ProjectCostLine>[] = [
    {
      id: 'custo',
      header: 'Custo',
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{row.name}</p>
          <p className="truncate text-[12px] text-fg-muted">
            {COST_CATEGORY_LABEL[row.category] ?? row.category}
          </p>
        </div>
      ),
    },
    {
      id: 'fornecedor',
      header: 'Fornecedor',
      hideBelow: 'md',
      sortValue: (row) => row.provider,
      cell: (row) => <span className="text-[13px] text-fg-muted">{row.provider || '—'}</span>,
    },
    {
      id: 'tipo',
      header: 'Tipo',
      hideBelow: 'lg',
      cell: (row) => (
        <Badge tone={COST_TYPE_BY_ID[row.costType]?.tone ?? 'neutro'} size="sm">
          {COST_TYPE_BY_ID[row.costType]?.label ?? row.costType}
        </Badge>
      ),
    },
    {
      id: 'periodo',
      header: 'Cobrança',
      hideBelow: 'xl',
      cell: (row) => (
        <span className="text-[13px] text-fg-muted">
          {formatCurrency(row.amount)} · {BILLING_PERIOD_LABEL[row.billingPeriod] ?? row.billingPeriod}
        </span>
      ),
    },
    {
      id: 'mensal',
      header: 'Custo mensal',
      align: 'right',
      sortValue: (row) => row.monthlyAmount,
      cell: (row) => <span className="font-medium">{formatCurrency(row.monthlyAmount)}</span>,
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
            <DropdownItem
              onSelect={() => {
                setEditing(row)
                setFormOpen(true)
              }}
            >
              <Pencil aria-hidden />
              Editar custo
            </DropdownItem>
            <DropdownItem destructive onSelect={() => setDeleting(row)}>
              <Trash2 aria-hidden />
              Remover
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/projetos">
          <ArrowLeft aria-hidden />
          Voltar para projetos
        </Link>
      </Button>

      <PageHeader
        title={project.name}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link to={`/empresas/${project.companyId}`} className="font-medium text-accent hover:underline">
              {project.companyName}
            </Link>
            <span className="text-fg-subtle">·</span>
            <span>{project.costEntries} linha(s) de custo</span>
          </span>
        }
        actions={
          <>
            <Badge tone={status?.tone ?? 'neutro'} dot>
              {status?.label ?? project.status}
            </Badge>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus aria-hidden />
              Novo custo
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Receita mensal"
          value={formatCurrency(project.monthlyRevenue)}
          icon={CircleDollarSign}
          footer={`${formatCurrency(project.annual.revenue)} ao ano`}
        />
        <KpiCard
          label="Custo mensal"
          value={formatCurrency(project.monthlyCost)}
          icon={Receipt}
          footer={`${formatCurrency(project.annual.cost)} ao ano`}
        />
        <KpiCard
          label="Lucro mensal"
          value={formatCurrency(project.monthlyProfit)}
          icon={TrendingUp}
          footer={`${formatCurrency(project.annual.profit)} ao ano`}
        />
        <KpiCard
          label="Margem"
          value={<MarginIndicator value={project.margin} revenue={project.monthlyRevenue} className="text-[26px] font-semibold" />}
          icon={Percent}
          footer={
            project.monthlyRevenue === 0
              ? 'Projeto ainda não fatura — o custo já corre'
              : 'Lucro sobre a receita do projeto'
          }
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-base font-semibold tracking-tight text-fg">Linhas de custo</h2>
            <DataTable
              columns={columns}
              rows={project.costs}
              rowKey={(row) => row.id}
              emptyIcon={Wallet}
              emptyTitle="Nenhum custo cadastrado"
              emptyDescription="Sem custo lançado, a margem deste projeto é só uma estimativa."
              emptyAction={
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditing(null)
                    setFormOpen(true)
                  }}
                >
                  <Plus aria-hidden />
                  Adicionar custo
                </Button>
              }
              initialSort={{ columnId: 'mensal', direction: 'desc' }}
            />
          </div>

          {byCategory.length ? (
            <ChartCard
              title="Custo por categoria"
              description="Onde o dinheiro deste projeto vai todo mês."
            >
              <CostBreakdownChart rows={byCategory} height={Math.max(180, byCategory.length * 44)} />
            </ChartCard>
          ) : null}
        </div>

        <Card className="h-fit">
          <CardHeader
            title="Serviços vendidos"
            description="A composição da receita contratada."
          />
          <CardBody className="pt-0">
            {project.services.length ? (
              <ul className="divide-y divide-line">
                {project.services.map((service) => (
                  <li key={service.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0 truncate text-[13px] text-fg">{service.name}</span>
                    <span className="shrink-0 text-[13px] font-medium text-fg tabular">
                      {formatCurrency(service.price)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={Wallet}
                title="Nenhum serviço detalhado"
                description="A receita está registrada apenas no total do projeto."
              />
            )}

            <div className="mt-4 rounded-xl border border-line bg-surface-muted p-3.5 text-[12px] leading-relaxed text-fg-muted">
              Custos pontuais não entram na conta mensal: só o que se repete compõe a margem
              recorrente. Valores anuais e trimestrais são convertidos para o mês
              {project.monthlyRevenue > 0
                ? ` — hoje a margem deste projeto é de ${formatPercent(project.margin)}.`
                : '.'}
            </div>
          </CardBody>
        </Card>
      </div>

      <CostForm
        open={formOpen}
        onOpenChange={setFormOpen}
        projectId={project.id}
        cost={editing}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover custo"
        description={deleting ? `${deleting.name} · ${formatCurrency(deleting.monthlyAmount)}/mês` : ''}
        confirmLabel="Remover"
        onConfirm={() => deleting && handleDelete(deleting)}
      />
    </div>
  )
}
