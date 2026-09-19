/**
 * Infra do mock.
 *
 * Toda a base e gerada por um PRNG com semente fixa: o dataset e sempre o
 * mesmo entre reloads (indicadores estaveis, prints reproduziveis), mas as
 * datas sao ancoradas em "hoje" para a agenda parecer viva.
 */
import { startOfDay } from 'date-fns'

export function createRandom(seed: number) {
  let state = seed >>> 0
  return function random() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Rng {
  next(): number
  int(min: number, max: number): number
  float(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  pickMany<T>(items: readonly T[], count: number): T[]
  bool(probability?: number): boolean
  /** Arredonda para o multiplo mais proximo — valores comerciais "redondos". */
  money(min: number, max: number, step?: number): number
}

export function createRng(seed: number): Rng {
  const random = createRandom(seed)
  const rng: Rng = {
    next: random,
    int: (min, max) => Math.floor(random() * (max - min + 1)) + min,
    float: (min, max) => random() * (max - min) + min,
    pick: (items) => items[Math.floor(random() * items.length)]!,
    pickMany: (items, count) => {
      const pool = [...items]
      const picked: (typeof items)[number][] = []
      const total = Math.min(count, pool.length)
      for (let i = 0; i < total; i += 1) {
        picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]!)
      }
      return picked
    },
    bool: (probability = 0.5) => random() < probability,
    money: (min, max, step = 500) => Math.round((random() * (max - min) + min) / step) * step,
  }
  return rng
}

/** Ancora temporal unica para toda a base mockada. */
export const TODAY = startOfDay(new Date())

export const FIRST_NAMES = [
  'João', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Juliana', 'Rafael', 'Camila', 'Bruno', 'Fernanda',
  'Gustavo', 'Patrícia', 'Thiago', 'Larissa', 'Felipe', 'Mariana', 'Rodrigo', 'Beatriz', 'Diego',
  'Carolina', 'Marcelo', 'Renata', 'André', 'Priscila', 'Vinícius', 'Aline', 'Eduardo', 'Tatiane',
  'Leonardo', 'Sabrina',
] as const

export const LAST_NAMES = [
  'Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento',
  'Lima', 'Araújo', 'Carvalho', 'Ribeiro', 'Gomes', 'Martins', 'Rocha', 'Barbosa', 'Teixeira',
  'Moreira', 'Cardoso',
] as const

export const CONTACT_ROLES = [
  'CEO', 'Diretor Comercial', 'Head de Marketing', 'Gerente de Operações', 'CTO', 'COO',
  'Sócio-fundador', 'Head de Growth', 'Gerente Comercial', 'Diretor de Atendimento',
] as const

export const PROJECT_TITLES = [
  'Implementação de agente de IA',
  'Automação de atendimento no WhatsApp',
  'Agente de qualificação de leads',
  'Automação de follow-up comercial',
  'Copiloto interno de vendas',
  'Integração de CRM com IA',
  'Agente de suporte nível 1',
  'Automação de propostas comerciais',
  'Dashboard inteligente de operação',
  'Agente de pré-atendimento 24/7',
  'Automação de cobrança e renovação',
  'Assistente de IA para pós-venda',
] as const

export const PLANS = ['Starter', 'Growth', 'Scale', 'Enterprise'] as const

export const NEEDS = [
  'Automatizar atendimento',
  'Aumentar geração de leads',
  'Reduzir tempo comercial',
  'Padronizar follow-up',
  'Qualificar leads automaticamente',
  'Integrar canais de venda',
  'Reduzir custo de operação',
  'Escalar time sem contratar',
] as const

export const PAIN_POINTS = [
  'Equipe sobrecarregada',
  'Muitos leads sem resposta',
  'Follow-up manual',
  'Perda de histórico de conversas',
  'Demora no primeiro atendimento',
  'Falta de previsibilidade de receita',
  'Processo comercial sem padrão',
  'Dados espalhados em planilhas',
] as const

export const INTERESTS = [
  'Agente de IA para vendas',
  'Agente de atendimento no WhatsApp',
  'Automação de funil comercial',
  'Copiloto de IA para o time interno',
  'Agente de suporte automatizado',
] as const

export const LOST_REASONS = [
  'Orçamento aprovado com concorrente',
  'Projeto adiado para o próximo trimestre',
  'Sem budget no momento',
  'Optou por solução interna',
] as const
