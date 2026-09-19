import { addDays, addHours, differenceInCalendarMonths, subDays } from 'date-fns'
import type { Company, Customer, CustomerStatus } from '@/types'
import { PLANS, TODAY, type Rng } from './seed'
import { TEAM } from './team'

/** Faixa de MRR por plano — mantem o ARR coerente com o mix da carteira. */
const MRR_BY_PLAN: Record<(typeof PLANS)[number], [number, number]> = {
  Starter: [2500, 3500],
  Growth: [4000, 6500],
  Scale: [7000, 11000],
  Enterprise: [12000, 18000],
}

/** Mix fixo da carteira: 20 clientes distribuidos entre os quatro planos. */
const PLAN_MIX: (typeof PLANS)[number][] = [
  'Enterprise', 'Scale', 'Growth', 'Starter', 'Growth', 'Scale', 'Starter', 'Growth',
  'Enterprise', 'Scale', 'Growth', 'Starter', 'Scale', 'Growth', 'Starter', 'Growth',
  'Scale', 'Starter', 'Growth', 'Starter',
]

const STATUS_MIX: CustomerStatus[] = [
  'ativo', 'ativo', 'expansao', 'ativo', 'onboarding', 'ativo', 'risco', 'ativo',
  'ativo', 'expansao', 'ativo', 'onboarding', 'ativo', 'ativo', 'churn', 'ativo',
  'expansao', 'risco', 'ativo', 'ativo',
]

const HEALTH_BY_STATUS: Record<CustomerStatus, [number, number]> = {
  ativo: [72, 92],
  onboarding: [60, 78],
  expansao: [88, 98],
  risco: [28, 48],
  churn: [8, 24],
}

export function buildCustomers(rng: Rng, companies: Company[]): Customer[] {
  return PLAN_MIX.map((plan, index) => {
    const company = companies[index]!
    const status = STATUS_MIX[index]!
    const [minMrr, maxMrr] = MRR_BY_PLAN[plan]
    const mrr = rng.money(minMrr, maxMrr, 250)
    const startedAt = subDays(TODAY, rng.int(70, 900))
    const monthsActive = Math.max(1, differenceInCalendarMonths(TODAY, startedAt))
    const [minHealth, maxHealth] = HEALTH_BY_STATUS[status]

    return {
      id: `cli-${String(index + 1).padStart(2, '0')}`,
      companyId: company.id,
      companyName: company.tradeName,
      primaryContact: company.contacts[0]!.name,
      plan,
      mrr,
      // LTV = receita recorrente acumulada + implantacao (um MRR de setup).
      ltv: mrr * monthsActive + mrr,
      status,
      startedAt: startedAt.toISOString(),
      lastInteractionAt: addHours(
        subDays(TODAY, rng.int(0, status === 'risco' ? 22 : 9)),
        rng.int(9, 19),
      ).toISOString(),
      renewalAt: addDays(TODAY, rng.int(8, 300)).toISOString(),
      ownerId: TEAM[rng.int(1, TEAM.length - 1)]!.id,
      healthScore: rng.int(minHealth, maxHealth),
    }
  })
}
