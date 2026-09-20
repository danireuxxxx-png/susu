import { subHours, subMinutes } from 'date-fns'
import type { NotificationItem } from '@/types'

const now = new Date()

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'not-1',
    title: 'Alpha Imóveis respondeu sua proposta',
    description: 'O contato pediu uma revisão do escopo antes de aprovar.',
    createdAt: subMinutes(now, 12).toISOString(),
    read: false,
    tone: 'positivo',
    href: '/pipeline',
  },
  {
    id: 'not-2',
    title: '3 leads sem contato há mais de 24h',
    description: 'O agente de follow-up sugeriu mensagens para cada um.',
    createdAt: subHours(now, 2).toISOString(),
    read: false,
    tone: 'atencao',
    href: '/leads',
  },
  {
    id: 'not-3',
    title: 'Reunião começa em 30 minutos',
    description: 'Demo da solução com Gamma Educação.',
    createdAt: subHours(now, 3).toISOString(),
    read: false,
    tone: 'info',
    href: '/atividades',
  },
  {
    id: 'not-4',
    title: 'Meta mensal está em 74%',
    description: 'Faltam 11 dias para o fechamento do mês.',
    createdAt: subHours(now, 6).toISOString(),
    read: true,
    tone: 'info',
    href: '/metas',
  },
  {
    id: 'not-5',
    title: 'Vertex Academias entrou em risco',
    description: 'Sem interação há 22 dias e renovação em 30 dias.',
    createdAt: subHours(now, 20).toISOString(),
    read: true,
    tone: 'critico',
    href: '/clientes',
  },
]
