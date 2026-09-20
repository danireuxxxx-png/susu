import { subDays } from 'date-fns'
import type {
  CostCategory,
  CostType,
  Customer,
  CustomerFinance,
  ProjectCostLine,
  ProjectEconomics,
  ProjectService,
  ProjectStatus,
} from '@/types'
import { TODAY, type Rng } from './seed'

/**
 * Projetos e custos da base mockada.
 *
 * São derivados dos clientes e do financeiro que já existem: a receita
 * dos projetos soma o MRR do cliente e os custos somam exatamente o custo
 * que a tela de financeiro mostra. Assim as telas novas contam a mesma
 * história das antigas.
 */

const PROJECT_NAMES = [
  'Agente Comercial IA',
  'Automação de atendimento',
  'Agente de qualificação',
  'Automação de follow-up',
  'Copiloto interno de vendas',
  'Integração de CRM',
  'Agente de suporte nível 1',
  'Automação de propostas',
  'Chatbot de pós-venda',
  'Agente de agendamento',
] as const

/** Composição típica do custo de um projeto de IA. */
const COST_TEMPLATE: { name: string; category: CostCategory; provider: string; type: CostType; weight: number }[] = [
  { name: 'Modelo de linguagem', category: 'AI_API', provider: 'OpenAI', type: 'USAGE_BASED', weight: 0.42 },
  { name: 'VPS de produção', category: 'VPS', provider: 'Hetzner', type: 'FIXED', weight: 0.22 },
  { name: 'API de WhatsApp', category: 'WHATSAPP_API', provider: 'Meta', type: 'VARIABLE', weight: 0.16 },
  { name: 'Banco de dados', category: 'DATABASE', provider: 'Supabase', type: 'FIXED', weight: 0.12 },
  { name: 'Armazenamento de mídias', category: 'STORAGE', provider: 'Cloudflare', type: 'FIXED', weight: 0.08 },
]

const STATUS_BY_CUSTOMER: Record<Customer['status'], ProjectStatus> = {
  ativo: 'ativo',
  expansao: 'ativo',
  onboarding: 'onboarding',
  risco: 'ativo',
  churn: 'cancelado',
}

export interface ProjectDataset {
  projects: ProjectEconomics[]
  costs: ProjectCostLine[]
  services: ProjectService[]
}

export function buildProjects(
  rng: Rng,
  customers: Customer[],
  byCustomer: CustomerFinance[],
): ProjectDataset {
  const costByCompany = new Map(byCustomer.map((row) => [row.customerId, row.cost]))

  const projects: ProjectEconomics[] = []
  const costs: ProjectCostLine[] = []
  const services: ProjectService[] = []

  customers.forEach((customer, index) => {
    // Clientes em expansão têm dois projetos; os demais, um.
    const total = customer.status === 'expansao' ? 2 : 1
    const customerCost = costByCompany.get(customer.id) ?? 0

    for (let slot = 0; slot < total; slot += 1) {
      const id = `proj-${customer.id}-${slot + 1}`
      const share = total === 1 ? 1 : slot === 0 ? 0.65 : 0.35
      const revenue = Math.round(customer.mrr * share)
      const status = STATUS_BY_CUSTOMER[customer.status]
      const monthlyRevenue = status === 'ativo' ? revenue : 0

      // O custo do cliente é distribuído entre seus projetos e, dentro de
      // cada projeto, entre as linhas do template — com a última linha
      // absorvendo o arredondamento para o total fechar exatamente.
      const projectCost = Math.round(customerCost * share)
      const lines = COST_TEMPLATE.slice(0, 3 + (index % 3))
      const weightTotal = lines.reduce((sum, line) => sum + line.weight, 0)

      let allocated = 0
      lines.forEach((line, lineIndex) => {
        const isLast = lineIndex === lines.length - 1
        const amount = isLast
          ? projectCost - allocated
          : Math.round((projectCost * line.weight) / weightTotal / 10) * 10
        allocated += amount

        costs.push({
          id: `${id}-custo-${lineIndex + 1}`,
          projectId: id,
          name: line.name,
          description: '',
          category: line.category,
          provider: line.provider,
          costType: line.type,
          amount: Math.max(0, amount),
          billingPeriod: 'MONTHLY',
          monthlyAmount: Math.max(0, amount),
          startDate: subDays(TODAY, rng.int(60, 400)).toISOString().slice(0, 10),
          endDate: null,
        })
      })

      const monthlyCost = costs
        .filter((cost) => cost.projectId === id)
        .reduce((sum, cost) => sum + cost.monthlyAmount, 0)

      services.push(
        {
          id: `${id}-srv-1`,
          projectId: id,
          name: 'Plataforma do agente',
          price: Math.round(revenue * 0.7),
          billingType: 'MONTHLY',
        },
        {
          id: `${id}-srv-2`,
          projectId: id,
          name: 'Sustentação e evolução',
          price: revenue - Math.round(revenue * 0.7),
          billingType: 'MONTHLY',
        },
      )

      projects.push({
        id,
        name: PROJECT_NAMES[(index + slot) % PROJECT_NAMES.length]!,
        companyId: customer.companyId,
        companyName: customer.companyName,
        status,
        startedAt: customer.startedAt,
        monthlyRevenue,
        monthlyCost,
        monthlyProfit: monthlyRevenue - monthlyCost,
        margin: monthlyRevenue === 0 ? 0 : Number((((monthlyRevenue - monthlyCost) / monthlyRevenue) * 100).toFixed(2)),
        costEntries: lines.length,
      })
    }
  })

  return { projects, costs, services }
}
