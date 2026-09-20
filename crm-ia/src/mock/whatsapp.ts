import { subMinutes } from 'date-fns'
import type { WhatsAppConversation } from '@/types'
import { TODAY } from './seed'

export const WHATSAPP_STATS = [
  { label: 'Conversas processadas hoje', value: 127, delta: 12.4 },
  { label: 'Leads capturados', value: 34, delta: 8.1 },
  { label: 'Dados atualizados', value: 89, delta: 22.6 },
  { label: 'Agendamentos', value: 12, delta: -4.2 },
]

const now = new Date()

/** Conversas simuladas — nenhuma mensagem sai ou entra de verdade. */
export const WHATSAPP_CONVERSATIONS: WhatsAppConversation[] = [
  {
    id: 'wa-1',
    contactName: 'João Silva',
    companyName: 'Alpha Imóveis',
    phone: '+55 (11) 98432-1190',
    lastMessageAt: subMinutes(now, 4).toISOString(),
    unread: 2,
    stage: 'Qualificação',
    addedToCrm: false,
    messages: [
      { id: 'wa-1-1', author: 'cliente', text: 'Oi, queria saber quanto custa um agente de IA para minha empresa.', time: '09:12' },
      { id: 'wa-1-2', author: 'agente', text: 'Claro! Para entender qual solução faz mais sentido, posso te fazer algumas perguntas?', time: '09:12' },
      { id: 'wa-1-3', author: 'cliente', text: 'Pode sim.', time: '09:13' },
      { id: 'wa-1-4', author: 'agente', text: 'Perfeito. Hoje o atendimento de vocês acontece por quais canais e quantas pessoas cuidam disso?', time: '09:13' },
      { id: 'wa-1-5', author: 'cliente', text: 'WhatsApp e Instagram. Temos 3 corretores respondendo, mas não damos conta. Muita gente fica sem resposta.', time: '09:15' },
      { id: 'wa-1-6', author: 'agente', text: 'Entendi. E existe um orçamento previsto para resolver isso?', time: '09:16' },
      { id: 'wa-1-7', author: 'cliente', text: 'Algo entre 10 e 20 mil. Precisamos rodar ainda esse mês.', time: '09:17' },
      { id: 'wa-1-8', author: 'agente', text: 'Ótimo. Tenho terça às 14h ou quarta às 10h para uma demo de 30 minutos. Qual fica melhor?', time: '09:17' },
    ],
    extracted: [
      { label: 'Nome', value: 'João Silva', confidence: 98 },
      { label: 'Empresa', value: 'Alpha Imóveis', confidence: 95 },
      { label: 'Segmento', value: 'Imobiliário', confidence: 91 },
      { label: 'Necessidade', value: 'Atendimento + vendas', confidence: 93 },
      { label: 'Orçamento', value: 'R$ 10k – 20k', confidence: 88 },
      { label: 'Urgência', value: 'Alta — quer rodar neste mês', confidence: 86 },
      { label: 'Canais atuais', value: 'WhatsApp e Instagram', confidence: 90 },
    ],
  },
  {
    id: 'wa-2',
    contactName: 'Camila Rocha',
    companyName: 'Vertex Academias',
    phone: '+55 (71) 99120-7744',
    lastMessageAt: subMinutes(now, 52).toISOString(),
    unread: 0,
    stage: 'Reunião agendada',
    addedToCrm: true,
    messages: [
      { id: 'wa-2-1', author: 'cliente', text: 'Recebi a indicação da Helix. Vocês fazem automação de matrícula?', time: '08:22' },
      { id: 'wa-2-2', author: 'agente', text: 'Fazemos sim. O agente cuida desde a primeira mensagem até o agendamento da aula experimental.', time: '08:23' },
      { id: 'wa-2-3', author: 'cliente', text: 'Perfeito. Somos 6 unidades, cada uma com um número diferente.', time: '08:25' },
      { id: 'wa-2-4', author: 'agente', text: 'Dá para centralizar tudo. Agendei uma conversa com o time comercial para quinta às 15h, pode ser?', time: '08:26' },
      { id: 'wa-2-5', author: 'cliente', text: 'Pode!', time: '08:27' },
    ],
    extracted: [
      { label: 'Nome', value: 'Camila Rocha', confidence: 97 },
      { label: 'Empresa', value: 'Vertex Academias', confidence: 94 },
      { label: 'Segmento', value: 'Fitness', confidence: 89 },
      { label: 'Necessidade', value: 'Automação de matrículas', confidence: 92 },
      { label: 'Origem', value: 'Indicação (Helix Consultoria)', confidence: 96 },
      { label: 'Urgência', value: 'Média', confidence: 74 },
    ],
  },
  {
    id: 'wa-3',
    contactName: 'Eduardo Lima',
    companyName: 'Rota Transportes',
    phone: '+55 (34) 99771-2088',
    lastMessageAt: subMinutes(now, 190).toISOString(),
    unread: 1,
    stage: 'Novo lead',
    addedToCrm: false,
    messages: [
      { id: 'wa-3-1', author: 'cliente', text: 'Vi o post de vocês sobre agente de suporte. Funciona para transportadora?', time: '06:40' },
      { id: 'wa-3-2', author: 'agente', text: 'Funciona. O caso mais comum é rastreio de carga e segunda via de documentos. É esse o cenário?', time: '06:41' },
      { id: 'wa-3-3', author: 'cliente', text: 'Exatamente isso. Hoje o pessoal responde no manual e demora.', time: '06:44' },
    ],
    extracted: [
      { label: 'Nome', value: 'Eduardo Lima', confidence: 96 },
      { label: 'Empresa', value: 'Rota Transportes', confidence: 92 },
      { label: 'Segmento', value: 'Transporte', confidence: 90 },
      { label: 'Necessidade', value: 'Suporte automatizado (rastreio)', confidence: 87 },
      { label: 'Orçamento', value: 'Não informado', confidence: 41 },
      { label: 'Urgência', value: 'Média', confidence: 63 },
    ],
  },
]

export const WHATSAPP_AGENT_STATUS = {
  connected: true,
  number: '+55 (11) 4003-2025',
  label: 'Agente conectado',
  since: TODAY.toISOString(),
  model: 'Modelo comercial · v2.4',
}
