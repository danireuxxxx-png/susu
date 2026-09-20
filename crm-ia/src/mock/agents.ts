import type { AIAgent } from '@/types'

/**
 * Catalogo dos agentes. Os numeros sao ilustrativos: nenhum agente esta
 * conectado nesta versao — a UI existe para o dia em que estiverem.
 */
export const AI_AGENTS: AIAgent[] = [
  {
    id: 'agente-comercial',
    name: 'Agente Comercial',
    description: 'Qualifica e atende leads novos, entende a necessidade e agenda reuniões.',
    status: 'ativo',
    role: 'Qualificação e atendimento de leads',
    metrics: [
      { label: 'Leads atendidos', value: '214' },
      { label: 'Taxa de qualificação', value: '62%' },
      { label: 'Tempo médio', value: '48s' },
    ],
    href: null,
    capabilities: [
      'Responde em até 1 minuto, 24/7',
      'Classifica o lead por orçamento, prazo e dor',
      'Agenda reuniões direto na agenda do time',
    ],
  },
  {
    id: 'agente-whatsapp',
    name: 'Agente WhatsApp',
    description: 'Lê as conversas, extrai dados estruturados e mantém o CRM atualizado sozinho.',
    status: 'configuracao',
    role: 'Captura de dados e atualização do CRM',
    metrics: [
      { label: 'Conversas hoje', value: '127' },
      { label: 'Leads capturados', value: '34' },
      { label: 'Campos atualizados', value: '89' },
    ],
    href: '/agentes/whatsapp',
    capabilities: [
      'Extrai nome, empresa, segmento e orçamento',
      'Detecta urgência e temperatura do lead',
      'Cria a oportunidade no pipeline automaticamente',
    ],
  },
  {
    id: 'agente-jornal',
    name: 'Jornal Matinal',
    description: 'Analisa a operação toda madrugada e entrega o briefing executivo às 7h.',
    status: 'ativo',
    role: 'Análise da operação e briefing diário',
    metrics: [
      { label: 'Briefings entregues', value: '142' },
      { label: 'Insights no mês', value: '96' },
      { label: 'Horário de envio', value: '07:00' },
    ],
    href: '/jornal-matinal',
    capabilities: [
      'Resume o dia anterior em números',
      'Prioriza o que precisa de ação hoje',
      'Aponta riscos antes que virem problema',
    ],
  },
  {
    id: 'agente-followup',
    name: 'Agente de Follow-up',
    description: 'Monitora oportunidades paradas e dispara o próximo toque no tempo certo.',
    status: 'em-breve',
    role: 'Reativação de oportunidades sem contato',
    metrics: [
      { label: 'Oportunidades monitoradas', value: '—' },
      { label: 'Reativações', value: '—' },
      { label: 'Previsão', value: 'Q4' },
    ],
    href: null,
    capabilities: [
      'Detecta oportunidades sem atividade há 48h',
      'Sugere a melhor mensagem para o momento',
      'Registra o toque na timeline da oportunidade',
    ],
  },
]
