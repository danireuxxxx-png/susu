import { database } from '@/mock/database'
import { COST_CATEGORY_LABEL } from '@/constants/costs'
import type {
  CostBreakdownRow,
  CustomerProfitability,
  OperationEconomics,
  ProjectCostLine,
  ProjectDetail,
  ProjectEconomics,
  ProjectStatus,
} from '@/types'
import { isBackendEnabled, request } from './api-client'
import { api, fetchAll } from './http'

/**
 * Rentabilidade: projetos, custos e lucro.
 *
 * Em modo conectado tudo vem do backend — inclusive o cálculo, que nunca
 * é refeito aqui. Em modo demonstração a mesma resposta é montada a
 * partir da base mockada.
 */

const STATUS_FROM_API: Record<string, ProjectStatus> = {
  PROPOSED: 'proposto',
  ONBOARDING: 'onboarding',
  ACTIVE: 'ativo',
  PAUSED: 'pausado',
  COMPLETED: 'concluido',
  CANCELLED: 'cancelado',
}

const number = (value: string | number | null | undefined) => Number(value ?? 0)

interface ApiMarginRow {
  project_id: string
  project_name: string
  company_id: string
  company_name: string
  status: string
  monthly_revenue: string
  monthly_cost: string
  monthly_profit: string
  margin: string
}

interface ApiProjectProfitability {
  projectId: string
  projectName: string
  companyId: string
  companyName: string
  status: string
  monthlyRevenue: string
  monthlyCost: string
  monthlyProfit: string
  margin: string
  annualized: { revenue: string; cost: string; profit: string }
  costBreakdown: {
    id: string
    name: string
    category: string
    provider: string | null
    costType: string
    monthlyAmount: string
  }[]
}

interface ApiCostRow {
  id: string
  project_id: string
  name: string
  description: string | null
  category: string
  provider: string | null
  cost_type: string
  amount: string
  billing_period: string
  start_date: string | null
  end_date: string | null
}

interface ApiServiceRow {
  id: string
  project_id: string
  name: string
  price: string
  billing_type: string
}

export interface CostInput {
  id?: string
  projectId: string
  name: string
  category: ProjectCostLine['category']
  provider: string
  costType: ProjectCostLine['costType']
  amount: number
  billingPeriod: ProjectCostLine['billingPeriod']
  description?: string
}

function mockOperation(): OperationEconomics {
  const current = database.finance.monthly[database.finance.monthly.length - 1]!
  const projectCost = database.projectCosts.reduce((total, cost) => total + cost.monthlyAmount, 0)
  const operatingCost = Math.max(0, current.cost - projectCost)
  const mrr = database.projects.reduce((total, project) => total + project.monthlyRevenue, 0)

  return {
    mrr,
    arr: mrr * 12,
    projectCost,
    operatingCost,
    totalCost: projectCost + operatingCost,
    grossProfit: mrr - projectCost,
    grossMargin: mrr === 0 ? 0 : Number((((mrr - projectCost) / mrr) * 100).toFixed(2)),
    netProfit: mrr - projectCost - operatingCost,
    netMargin: mrr === 0 ? 0 : Number((((mrr - projectCost - operatingCost) / mrr) * 100).toFixed(2)),
  }
}

export const economicsService = {
  /** GET /financial/margins — um projeto por linha, com margem. */
  async listProjects(): Promise<ProjectEconomics[]> {
    if (!isBackendEnabled) {
      return request('/projects', () => database.projects, { latency: 260 })
    }

    const rows = await api.get<ApiMarginRow[]>('/financial/margins')
    return rows.map((row) => ({
      id: row.project_id,
      name: row.project_name,
      companyId: row.company_id,
      companyName: row.company_name,
      status: STATUS_FROM_API[row.status] ?? 'proposto',
      startedAt: null,
      monthlyRevenue: number(row.monthly_revenue),
      monthlyCost: number(row.monthly_cost),
      monthlyProfit: number(row.monthly_profit),
      margin: number(row.margin),
      costEntries: 0,
    }))
  },

  /** GET /projects/:id/economics — detalhe com a quebra de custos. */
  async getProject(id: string): Promise<ProjectDetail | null> {
    if (!isBackendEnabled) {
      return request(`/projects/${id}`, () => {
        const project = database.projects.find((item) => item.id === id)
        if (!project) return null
        return {
          ...project,
          annual: {
            revenue: project.monthlyRevenue * 12,
            cost: project.monthlyCost * 12,
            profit: project.monthlyProfit * 12,
          },
          costs: database.projectCosts.filter((cost) => cost.projectId === id),
          services: database.projectServices.filter((service) => service.projectId === id),
        }
      })
    }

    const [economics, costs, services] = await Promise.all([
      api.get<ApiProjectProfitability | null>(`/projects/${id}/economics`),
      fetchAll<ApiCostRow>(`/project-costs?projectId=${id}`),
      fetchAll<ApiServiceRow>(`/project-services?projectId=${id}`),
    ])

    if (!economics) return null

    // O valor mensal de cada linha vem calculado pelo backend; o cadastro
    // (período, datas) vem da listagem de custos.
    const monthlyById = new Map(
      economics.costBreakdown.map((line) => [line.id, number(line.monthlyAmount)]),
    )

    return {
      id: economics.projectId,
      name: economics.projectName,
      companyId: economics.companyId,
      companyName: economics.companyName,
      status: STATUS_FROM_API[economics.status] ?? 'proposto',
      startedAt: null,
      monthlyRevenue: number(economics.monthlyRevenue),
      monthlyCost: number(economics.monthlyCost),
      monthlyProfit: number(economics.monthlyProfit),
      margin: number(economics.margin),
      costEntries: economics.costBreakdown.length,
      annual: {
        revenue: number(economics.annualized.revenue),
        cost: number(economics.annualized.cost),
        profit: number(economics.annualized.profit),
      },
      costs: costs.map((cost) => ({
        id: cost.id,
        projectId: cost.project_id,
        name: cost.name,
        description: cost.description ?? '',
        category: (cost.category as ProjectCostLine['category']) ?? 'OTHER',
        provider: cost.provider ?? '',
        costType: (cost.cost_type as ProjectCostLine['costType']) ?? 'FIXED',
        amount: number(cost.amount),
        billingPeriod: (cost.billing_period as ProjectCostLine['billingPeriod']) ?? 'MONTHLY',
        monthlyAmount: monthlyById.get(cost.id) ?? 0,
        startDate: cost.start_date,
        endDate: cost.end_date,
      })),
      services: services.map((service) => ({
        id: service.id,
        projectId: service.project_id,
        name: service.name,
        price: number(service.price),
        billingType: service.billing_type,
      })),
    }
  },

  /** GET /financial/customer-profitability — ordenação feita no banco. */
  async listCustomerProfitability(
    orderBy: 'revenue' | 'cost' | 'profit' | 'margin' | 'name' = 'profit',
    direction: 'asc' | 'desc' = 'desc',
  ): Promise<CustomerProfitability[]> {
    if (!isBackendEnabled) {
      return request('/financial/customer-profitability', () => {
        const byCompany = new Map<string, CustomerProfitability>()

        for (const project of database.projects) {
          const current = byCompany.get(project.companyId) ?? {
            companyId: project.companyId,
            companyName: project.companyName,
            projectsTotal: 0,
            projectsActive: 0,
            monthlyRevenue: 0,
            monthlyCost: 0,
            monthlyProfit: 0,
            margin: 0,
            annualRevenue: 0,
            annualProfit: 0,
          }

          current.projectsTotal += 1
          if (project.status === 'ativo') current.projectsActive += 1
          current.monthlyRevenue += project.monthlyRevenue
          current.monthlyCost += project.monthlyCost
          current.monthlyProfit += project.monthlyProfit
          byCompany.set(project.companyId, current)
        }

        const rows = [...byCompany.values()].map((row) => ({
          ...row,
          margin: row.monthlyRevenue === 0 ? 0 : Number(((row.monthlyProfit / row.monthlyRevenue) * 100).toFixed(2)),
          annualRevenue: row.monthlyRevenue * 12,
          annualProfit: row.monthlyProfit * 12,
        }))

        const key = {
          revenue: 'monthlyRevenue',
          cost: 'monthlyCost',
          profit: 'monthlyProfit',
          margin: 'margin',
          name: 'companyName',
        }[orderBy] as keyof CustomerProfitability

        return rows.sort((a, b) => {
          const left = a[key]
          const right = b[key]
          const comparison =
            typeof left === 'number' && typeof right === 'number'
              ? left - right
              : String(left).localeCompare(String(right), 'pt-BR')
          return direction === 'asc' ? comparison : -comparison
        })
      })
    }

    const rows = await api.get<Record<string, string>[]>(
      `/financial/customer-profitability?orderBy=${orderBy}&direction=${direction}&limit=200`,
    )

    return rows.map((row) => ({
      companyId: String(row.company_id),
      companyName: String(row.company_name),
      projectsTotal: number(row.projects_total),
      projectsActive: number(row.projects_active),
      monthlyRevenue: number(row.monthly_revenue),
      monthlyCost: number(row.monthly_cost),
      monthlyProfit: number(row.monthly_profit),
      margin: number(row.margin),
      annualRevenue: number(row.annual_revenue),
      annualProfit: number(row.annual_profit),
    }))
  },

  /** GET /financial/expenses — custos do mês por categoria e fornecedor. */
  async costBreakdown(): Promise<{ byCategory: CostBreakdownRow[]; byProvider: CostBreakdownRow[] }> {
    if (!isBackendEnabled) {
      return request('/financial/expenses', () => {
        const group = (selector: (cost: (typeof database.projectCosts)[number]) => string) => {
          const map = new Map<string, CostBreakdownRow>()
          for (const cost of database.projectCosts) {
            const key = selector(cost)
            const current = map.get(key) ?? {
              key,
              label: key,
              scope: 'PROJECT' as const,
              entries: 0,
              monthlyAmount: 0,
            }
            current.entries += 1
            current.monthlyAmount += cost.monthlyAmount
            map.set(key, current)
          }
          return [...map.values()].sort((a, b) => b.monthlyAmount - a.monthlyAmount)
        }

        return {
          byCategory: group((cost) => cost.category).map((row) => ({
            ...row,
            label: COST_CATEGORY_LABEL[row.key as ProjectCostLine['category']] ?? row.key,
          })),
          byProvider: group((cost) => cost.provider || 'Não informado'),
        }
      })
    }

    const data = await api.get<{
      byCategory: { category: string; scope: string; entries: number; monthly_amount: string }[]
      byProvider: { provider: string; entries: number; monthly_amount: string }[]
    }>('/financial/expenses')

    return {
      byCategory: data.byCategory
        .map((row) => ({
          key: row.category,
          label: COST_CATEGORY_LABEL[row.category as ProjectCostLine['category']] ?? row.category,
          scope: row.scope as CostBreakdownRow['scope'],
          entries: Number(row.entries),
          monthlyAmount: number(row.monthly_amount),
        }))
        .sort((a, b) => b.monthlyAmount - a.monthlyAmount),
      byProvider: data.byProvider
        .map((row) => ({
          key: row.provider,
          label: row.provider,
          scope: 'PROJECT' as const,
          entries: Number(row.entries),
          monthlyAmount: number(row.monthly_amount),
        }))
        .sort((a, b) => b.monthlyAmount - a.monthlyAmount),
    }
  },

  /** GET /financial/summary — visão da operação inteira. */
  async operation(): Promise<OperationEconomics> {
    if (!isBackendEnabled) {
      return request('/financial/summary', mockOperation)
    }

    const data = await api.get<{
      recurring: { mrr: number; arr: number }
      costs: { projects: number; operating: number; total: number }
      profit: { gross: number; grossMargin: number; net: number; netMargin: number }
    }>('/financial/summary')

    return {
      mrr: data.recurring.mrr,
      arr: data.recurring.arr,
      projectCost: data.costs.projects,
      operatingCost: data.costs.operating,
      totalCost: data.costs.total,
      grossProfit: data.profit.gross,
      grossMargin: data.profit.grossMargin,
      netProfit: data.profit.net,
      netMargin: data.profit.netMargin,
    }
  },

  /** POST/PATCH /project-costs */
  async saveCost(input: CostInput): Promise<void> {
    if (!isBackendEnabled) {
      await request('/project-costs', () => input, { latency: 220 })
      return
    }

    const payload = {
      projectId: input.projectId,
      name: input.name,
      category: input.category,
      provider: input.provider || undefined,
      costType: input.costType,
      amount: input.amount,
      billingPeriod: input.billingPeriod,
      description: input.description || undefined,
    }

    if (input.id) await api.patch(`/project-costs/${input.id}`, payload)
    else await api.post('/project-costs', payload)
  },

  /** DELETE /project-costs/:id */
  async deleteCost(id: string): Promise<void> {
    if (!isBackendEnabled) {
      await request(`/project-costs/${id}`, () => ({ id }), { latency: 180 })
      return
    }
    await api.delete(`/project-costs/${id}`)
  },
}
