import { database } from '@/mock/database'
import type { WhatsAppConversation } from '@/types'
import { request } from './api-client'

/**
 * Superficie do agente de WhatsApp.
 *
 * A integracao real (API oficial do WhatsApp Business + webhooks de mensagem)
 * entra aqui. Hoje as conversas sao simuladas e nada e enviado.
 */
export const whatsappService = {
  /** GET /whatsapp/conversations */
  listConversations(): Promise<WhatsAppConversation[]> {
    return request('/whatsapp/conversations', () => database.conversations, { latency: 300 })
  },

  /** GET /whatsapp/status */
  status() {
    return request('/whatsapp/status', () => database.whatsappStatus, { latency: 150 })
  },

  /** POST /whatsapp/conversations/:id/import — cria lead/oportunidade a partir da conversa. */
  importToCrm(conversationId: string): Promise<{ conversationId: string }> {
    return request(`/whatsapp/conversations/${conversationId}/import`, () => ({ conversationId }), {
      latency: 600,
    })
  },
}
