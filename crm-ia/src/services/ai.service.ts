import { database } from '@/mock/database'
import type { AIAgent, MorningBriefing } from '@/types'
import { request } from './api-client'

/**
 * Superficie dos agentes de IA.
 *
 * Nenhuma LLM e chamada nesta versao: `generateBriefing` devolve o briefing
 * mockado. Quando houver backend, este e o unico ponto que passa a falar com
 * a API de IA (geracao do jornal, insights e sugestoes de follow-up).
 */
export const aiService = {
  /** GET /agents */
  listAgents(): Promise<AIAgent[]> {
    return request('/agents', () => database.agents, { latency: 220 })
  },

  /** POST /agents/morning-briefing — hoje mock, amanha job diario + LLM. */
  generateBriefing(): Promise<MorningBriefing> {
    return request('/agents/morning-briefing', () => database.briefing, { latency: 900 })
  },
}
