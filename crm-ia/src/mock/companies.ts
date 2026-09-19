import { addDays, subDays } from 'date-fns'
import type { Company, ClientIntelligence, Contact } from '@/types'
import {
  CONTACT_ROLES,
  FIRST_NAMES,
  INTERESTS,
  LAST_NAMES,
  NEEDS,
  PAIN_POINTS,
  TODAY,
  type Rng,
} from './seed'

interface CompanySeed {
  trade: string
  legalSuffix: 'LTDA' | 'S.A.' | 'ME'
  segment: string
  city: string
  state: string
  size: Company['size']
}

/** 30 empresas curadas — nomes ficticios, distribuicao realista de segmentos. */
const COMPANY_SEEDS: CompanySeed[] = [
  { trade: 'Alpha Imóveis', legalSuffix: 'LTDA', segment: 'Imobiliário', city: 'São Paulo', state: 'SP', size: 'media' },
  { trade: 'Beta Contabilidade', legalSuffix: 'LTDA', segment: 'Serviços financeiros', city: 'Campinas', state: 'SP', size: 'pequena' },
  { trade: 'Gamma Educação', legalSuffix: 'S.A.', segment: 'Educação', city: 'Belo Horizonte', state: 'MG', size: 'grande' },
  { trade: 'Delta Logística', legalSuffix: 'LTDA', segment: 'Logística', city: 'Curitiba', state: 'PR', size: 'media' },
  { trade: 'Órbita Clínicas', legalSuffix: 'LTDA', segment: 'Saúde', city: 'Porto Alegre', state: 'RS', size: 'media' },
  { trade: 'Vetor Seguros', legalSuffix: 'S.A.', segment: 'Seguros', city: 'Rio de Janeiro', state: 'RJ', size: 'grande' },
  { trade: 'Nimbus Tecnologia', legalSuffix: 'LTDA', segment: 'Tecnologia', city: 'Florianópolis', state: 'SC', size: 'pequena' },
  { trade: 'Prisma Varejo', legalSuffix: 'S.A.', segment: 'Varejo', city: 'São Paulo', state: 'SP', size: 'grande' },
  { trade: 'Solaris Energia', legalSuffix: 'LTDA', segment: 'Energia', city: 'Fortaleza', state: 'CE', size: 'media' },
  { trade: 'Atlas Construtora', legalSuffix: 'LTDA', segment: 'Construção civil', city: 'Goiânia', state: 'GO', size: 'media' },
  { trade: 'Lumen Odontologia', legalSuffix: 'ME', segment: 'Saúde', city: 'Ribeirão Preto', state: 'SP', size: 'micro' },
  { trade: 'Krono Advocacia', legalSuffix: 'LTDA', segment: 'Jurídico', city: 'Brasília', state: 'DF', size: 'pequena' },
  { trade: 'Vertex Academias', legalSuffix: 'LTDA', segment: 'Fitness', city: 'Salvador', state: 'BA', size: 'media' },
  { trade: 'Nova Ótica', legalSuffix: 'ME', segment: 'Varejo', city: 'Recife', state: 'PE', size: 'micro' },
  { trade: 'Magna Distribuidora', legalSuffix: 'S.A.', segment: 'Distribuição', city: 'Joinville', state: 'SC', size: 'grande' },
  { trade: 'Îlha Turismo', legalSuffix: 'LTDA', segment: 'Turismo', city: 'Balneário Camboriú', state: 'SC', size: 'pequena' },
  { trade: 'Pulso Marketing', legalSuffix: 'LTDA', segment: 'Agência', city: 'São Paulo', state: 'SP', size: 'pequena' },
  { trade: 'Cedro Alimentos', legalSuffix: 'S.A.', segment: 'Alimentos', city: 'Londrina', state: 'PR', size: 'grande' },
  { trade: 'Helix Consultoria', legalSuffix: 'LTDA', segment: 'Consultoria', city: 'São Paulo', state: 'SP', size: 'media' },
  { trade: 'Aurora Estética', legalSuffix: 'ME', segment: 'Estética', city: 'Vitória', state: 'ES', size: 'micro' },
  { trade: 'Quantum Fintech', legalSuffix: 'S.A.', segment: 'Fintech', city: 'São Paulo', state: 'SP', size: 'grande' },
  { trade: 'Terra Agro', legalSuffix: 'LTDA', segment: 'Agronegócio', city: 'Cuiabá', state: 'MT', size: 'media' },
  { trade: 'Meridiano Hotéis', legalSuffix: 'S.A.', segment: 'Hotelaria', city: 'Natal', state: 'RN', size: 'grande' },
  { trade: 'Forja Indústria', legalSuffix: 'LTDA', segment: 'Indústria', city: 'Caxias do Sul', state: 'RS', size: 'media' },
  { trade: 'Rota Transportes', legalSuffix: 'LTDA', segment: 'Transporte', city: 'Uberlândia', state: 'MG', size: 'media' },
  { trade: 'Clara Pet', legalSuffix: 'ME', segment: 'Pet', city: 'Santos', state: 'SP', size: 'micro' },
  { trade: 'Norte Engenharia', legalSuffix: 'LTDA', segment: 'Engenharia', city: 'Manaus', state: 'AM', size: 'pequena' },
  { trade: 'Sigma Softwares', legalSuffix: 'LTDA', segment: 'Tecnologia', city: 'São Carlos', state: 'SP', size: 'pequena' },
  { trade: 'Bella Moda', legalSuffix: 'ME', segment: 'Moda', city: 'Blumenau', state: 'SC', size: 'micro' },
  { trade: 'Horizonte Eventos', legalSuffix: 'LTDA', segment: 'Eventos', city: 'Gramado', state: 'RS', size: 'pequena' },
]

const EMPLOYEES_BY_SIZE: Record<Company['size'], [number, number]> = {
  micro: [3, 12],
  pequena: [12, 60],
  media: [60, 260],
  grande: [260, 1800],
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function cnpj(rng: Rng) {
  const block = (size: number) => String(rng.int(0, 10 ** size - 1)).padStart(size, '0')
  return `${block(2)}.${block(3)}.${block(3)}/0001-${block(2)}`
}

function phone(rng: Rng) {
  return `+55 (${rng.int(11, 85)}) 9${rng.int(1000, 9999)}-${rng.int(1000, 9999)}`
}

function buildContacts(rng: Rng, company: CompanySeed, companyId: string): Contact[] {
  const total = company.size === 'micro' ? 1 : rng.int(1, 3)
  const domain = `${slugify(company.trade)}.com.br`
  return Array.from({ length: total }, (_, index) => {
    const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`
    return {
      id: `${companyId}-contato-${index + 1}`,
      name,
      role: index === 0 ? rng.pick(CONTACT_ROLES.slice(0, 4)) : rng.pick(CONTACT_ROLES),
      email: `${slugify(name.split(' ')[0]!)}@${domain}`,
      whatsapp: phone(rng),
      companyId,
      isPrimary: index === 0,
    }
  })
}

function buildIntelligence(rng: Rng): ClientIntelligence {
  const budgetMin = rng.money(6000, 18000, 1000)
  return {
    needs: rng.pickMany(NEEDS, rng.int(2, 4)),
    painPoints: rng.pickMany(PAIN_POINTS, rng.int(2, 3)),
    interest: rng.pick(INTERESTS),
    budgetMin,
    budgetMax: budgetMin + rng.money(6000, 16000, 1000),
    deadlineDays: rng.pick([15, 30, 45, 60, 90]),
    temperature: rng.pick(['frio', 'morno', 'quente', 'quente'] as const),
    lastSyncedAt: addDays(TODAY, 0).toISOString(),
    confidence: rng.int(72, 97),
  }
}

export function buildCompanies(rng: Rng): Company[] {
  return COMPANY_SEEDS.map((seed, index) => {
    const id = `emp-${String(index + 1).padStart(2, '0')}`
    const [minEmployees, maxEmployees] = EMPLOYEES_BY_SIZE[seed.size]
    return {
      id,
      legalName: `${seed.trade} ${seed.legalSuffix}`,
      tradeName: seed.trade,
      cnpj: cnpj(rng),
      segment: seed.segment,
      size: seed.size,
      city: seed.city,
      state: seed.state,
      website: `www.${slugify(seed.trade)}.com.br`,
      employees: rng.int(minEmployees, maxEmployees),
      createdAt: subDays(TODAY, rng.int(30, 720)).toISOString(),
      contacts: buildContacts(rng, seed, id),
      mrr: 0,
      contract: null,
      ticket: 0,
      totalSold: 0,
      intelligence: rng.bool(0.7) ? buildIntelligence(rng) : null,
    }
  })
}
