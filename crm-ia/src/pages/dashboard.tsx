import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  Contact2,
  Percent,
  Receipt,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FinanceChart } from '@/components/charts/finance-chart'
import { LeadSourceChart } from '@/components/charts/lead-source-chart'
import { PipelineFunnelChart } from '@/components/charts/pipeline-funnel-chart'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { REVENUE_RANGE_OPTIONS, type RevenueRange } from '@/constants/charts'
import { RevenueGoalChart } from '@/components/charts/revenue-goal-chart'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ChartCard } from '@/components/ui/chart-card'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import { Segmented } from '@/components/ui/segmented'
import { ActivityTypeBadge } from '@/components/ui/status-badge'
import { useCrmData } from '@/hooks/use-crm'
import { formatCurrency, formatNumber, formatPercent, formatRelative, formatTime } from '@/lib/format'
import {
  activeCustomers,
  averageTicket,
  conversionRate,
  deltaBetween,
  financeTotals,
  funnelSummary,
  leadsBySource,
  newLeadsWindow,
  pipelineValue,
  stalledOpportunities,
  todayActivities,
} from '@/lib/metrics'
import { CURRENT_USER } from '@/mock/team'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  const { opportunities, leads, customers, finance, activities } = useCrmData()
  const [range, setRange] = useState<RevenueRange>('30d')

  const metrics = useMemo(() => {
    const current = finance.monthly[finance.monthly.length - 1]
    const previous = finance.monthly[finance.monthly.length - 2]
    const currentTotals = financeTotals(current)
    const previousTotals = financeTotals(previous)
    const leadsWindow = newLeadsWindow(leads)

    return {
      revenue: currentTotals.revenue,
      revenueDelta: deltaBetween(currentTotals.revenue, previousTotals.revenue),
      profit: currentTotals.profit,
      profitDelta: deltaBetween(currentTotals.profit, previousTotals.profit),
      margin: currentTotals.margin,
      pipeline: pipelineValue(opportunities),
      leads: leadsWindow,
      customers: activeCustomers(customers).length,
      conversion: conversionRate(opportunities),
      ticket: averageTicket(opportunities),
      revenueTrend: finance.monthly.slice(-12).map((month) => month.revenue),
      profitTrend: finance.monthly.slice(-12).map((month) => month.revenue - month.cost),
    }
  }, [finance, leads, opportunities, customers])

  const stages = useMemo(() => funnelSummary(opportunities), [opportunities])
  const sources = useMemo(() => leadsBySource(leads), [leads])
  const attention = useMemo(() => stalledOpportunities(opportunities, 6).slice(0, 5), [opportunities])
  const agenda = useMemo(() => todayActivities(activities).slice(0, 5), [activities])

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            {greeting()}, {CURRENT_USER.name.split(' ')[0]} <span aria-hidden>👋</span>
          </>
        }
        description="Aqui está o resumo da sua operação."
        actions={
          <Button variant="secondary" asChild>
            <Link to="/jornal-matinal">
              Ver jornal matinal
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Receita"
          value={formatCurrency(metrics.revenue)}
          delta={metrics.revenueDelta}
          icon={CircleDollarSign}
          trend={metrics.revenueTrend}
          hint="Receita recorrente da carteira somada aos projetos fechados no mês."
        />
        <KpiCard
          label="Lucro"
          value={formatCurrency(metrics.profit)}
          delta={metrics.profitDelta}
          icon={TrendingUp}
          trend={metrics.profitTrend}
          footer={`Margem de ${formatPercent(metrics.margin)}`}
        />
        <KpiCard
          label="Pipeline"
          value={formatCurrency(metrics.pipeline)}
          delta={undefined}
          icon={Workflow}
          footer={`${stages.reduce((total, stage) => total + stage.count, 0)} oportunidades em aberto`}
        />
        <KpiCard
          label="Novos leads"
          value={formatNumber(metrics.leads.current)}
          delta={metrics.leads.delta}
          deltaSuffix="vs. 30 dias anteriores"
          icon={Contact2}
        />
        <KpiCard
          label="Clientes ativos"
          value={formatNumber(metrics.customers)}
          delta={undefined}
          icon={Users}
          footer={`${customers.length} contratos na base`}
        />
        <KpiCard
          label="Taxa de conversão"
          value={formatPercent(metrics.conversion)}
          delta={undefined}
          icon={Percent}
          footer="Ganhos sobre o total de negócios fechados"
        />
        <KpiCard
          label="Ticket médio"
          value={formatCurrency(metrics.ticket)}
          delta={undefined}
          icon={Receipt}
          footer="Média dos projetos ganhos"
        />
        <KpiCard
          label="Previsão ponderada"
          value={formatCurrency(
            opportunities
              .filter((item) => item.stage !== 'ganho' && item.stage !== 'perdido')
              .reduce((total, item) => total + (item.value * item.probability) / 100, 0),
          )}
          delta={undefined}
          icon={CalendarClock}
          hint="Valor do pipeline ponderado pela probabilidade de cada etapa."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Receita ao longo do tempo"
          description="Receita reconhecida no período selecionado."
          className="xl:col-span-2"
          action={
            <Segmented
              size="sm"
              ariaLabel="Período da receita"
              options={REVENUE_RANGE_OPTIONS}
              value={range}
              onChange={setRange}
            />
          }
        >
          <RevenueChart daily={finance.daily} monthly={finance.monthly} range={range} />
        </ChartCard>

        <ChartCard title="Pipeline por etapa" description="Valor em aberto por estágio do funil.">
          <PipelineFunnelChart stages={stages} />
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Receita vs. meta"
          description="Últimos 6 meses comparados à meta do período."
          className="xl:col-span-2"
        >
          <RevenueGoalChart months={finance.monthly} />
        </ChartCard>

        <ChartCard title="Origem dos leads" description="De onde vêm os contatos na base.">
          <LeadSourceChart sources={sources} />
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Precisa de atenção"
            description="Oportunidades sem interação recente."
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/pipeline">
                  Ver pipeline
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
          />
          <CardBody className="pt-0">
            {attention.length ? (
              <ul className="divide-y divide-line">
                {attention.map((opportunity) => (
                  <li key={opportunity.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-fg">{opportunity.companyName}</p>
                      <p className="truncate text-[12px] text-fg-muted">
                        {opportunity.title} · {formatRelative(opportunity.lastInteractionAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-semibold text-fg tabular">
                      {formatCurrency(opportunity.value)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={Workflow}
                title="Nenhuma oportunidade parada"
                description="Todo o pipeline teve interação nos últimos dias."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Agenda de hoje"
            description="Compromissos e tarefas do dia."
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/atividades">
                  Ver agenda
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
          />
          <CardBody className="pt-0">
            {agenda.length ? (
              <ul className="divide-y divide-line">
                {agenda.map((activity) => (
                  <li key={activity.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-12 shrink-0 text-[13px] font-medium text-fg-muted tabular">
                      {formatTime(activity.scheduledAt)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-fg">{activity.title}</p>
                      <p className="truncate text-[12px] text-fg-muted">{activity.companyName}</p>
                    </div>
                    <ActivityTypeBadge type={activity.type} size="sm" />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={CalendarClock}
                title="Agenda livre"
                description="Nenhuma atividade agendada para hoje."
              />
            )}
          </CardBody>
        </Card>
      </section>

      <ChartCard
        title="Receita, custo e lucro"
        description="A coluna inteira é a receita do mês: custo embaixo, lucro em cima."
        footer="Os custos incluem infraestrutura, time e ferramentas alocadas aos projetos."
      >
        <FinanceChart months={finance.monthly} />
      </ChartCard>
    </div>
  )
}
