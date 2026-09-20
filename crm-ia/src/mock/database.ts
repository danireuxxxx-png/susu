import type { Company, Customer, Opportunity } from '@/types'
import { buildActivities } from './activities'
import { AI_AGENTS } from './agents'
import { buildBriefing } from './briefing'
import { buildCompanies } from './companies'
import { buildCustomers } from './customers'
import { buildFinance } from './finance'
import { buildGoals } from './goals'
import { buildLeads } from './leads'
import { NOTIFICATIONS } from './notifications'
import { buildOpportunities } from './opportunities'
import { buildProjects } from './projects'
import { createRng } from './seed'
import { CURRENT_USER, TEAM } from './team'
import { WHATSAPP_AGENT_STATUS, WHATSAPP_CONVERSATIONS, WHATSAPP_STATS } from './whatsapp'

/**
 * Propaga para o cadastro da empresa o que foi vendido de fato: MRR do
 * contrato ativo, projetos ganhos e ticket medio. Evita que a ficha da
 * empresa contradiga o pipeline ou o financeiro.
 */
function linkCommercialData(
  companies: Company[],
  customers: Customer[],
  opportunities: Opportunity[],
) {
  const customerByCompany = new Map(customers.map((customer) => [customer.companyId, customer]))

  for (const company of companies) {
    const customer = customerByCompany.get(company.id)
    const won = opportunities.filter(
      (item) => item.companyId === company.id && item.stage === 'ganho',
    )
    const wonValue = won.reduce((total, item) => total + item.value, 0)

    company.mrr = customer?.mrr ?? 0
    company.contract = customer ? `${customer.plan} · 12 meses` : null
    company.totalSold = wonValue + (customer ? Math.round(customer.ltv) : 0)
    // Sem projeto fechado nao existe ticket medio — melhor vazio que inventado.
    company.ticket = won.length ? Math.round(wonValue / won.length) : 0
  }
}

function createDatabase() {
  // Semente fixa: a base e identica a cada reload.
  const rng = createRng(20_260_919)

  const companies = buildCompanies(rng)
  const customers = buildCustomers(rng, companies)
  const opportunities = buildOpportunities(rng, companies)
  const leads = buildLeads(rng, companies)
  const activities = buildActivities(rng, opportunities)
  const finance = buildFinance(rng, customers, opportunities)

  linkCommercialData(companies, customers, opportunities)

  const delivery = buildProjects(rng, customers, finance.byCustomer)
  const currentRevenue = finance.monthly[finance.monthly.length - 1]!.revenue
  const goals = buildGoals(customers, opportunities, activities, currentRevenue)
  const briefing = buildBriefing(opportunities, activities, leads)

  return {
    companies,
    customers,
    opportunities,
    leads,
    activities,
    finance,
    projects: delivery.projects,
    projectCosts: delivery.costs,
    projectServices: delivery.services,
    goals,
    briefing,
    agents: AI_AGENTS,
    notifications: NOTIFICATIONS,
    conversations: WHATSAPP_CONVERSATIONS,
    whatsappStats: WHATSAPP_STATS,
    whatsappStatus: WHATSAPP_AGENT_STATUS,
    team: TEAM,
    currentUser: CURRENT_USER,
  }
}

export type CrmDatabase = ReturnType<typeof createDatabase>

/** Snapshot unico consumido pela camada de servicos. */
export const database = createDatabase()
