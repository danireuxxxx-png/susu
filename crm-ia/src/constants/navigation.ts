import {
  Building2,
  CalendarCheck,
  Contact2,
  LayoutDashboard,
  MessageSquareText,
  Newspaper,
  Settings,
  Sparkles,
  Target,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Rotas filhas que tambem devem acender o item no menu. */
  match?: string[]
  badge?: 'novo'
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operação',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Pipeline', href: '/pipeline', icon: Workflow },
      { label: 'Leads', href: '/leads', icon: Contact2 },
      { label: 'Clientes', href: '/clientes', icon: Users },
      { label: 'Empresas', href: '/empresas', icon: Building2 },
      { label: 'Atividades', href: '/atividades', icon: CalendarCheck },
    ],
  },
  {
    label: 'Resultado',
    items: [
      { label: 'Financeiro', href: '/financeiro', icon: Wallet },
      { label: 'Metas', href: '/metas', icon: Target },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { label: 'Agentes IA', href: '/agentes', icon: Sparkles, match: ['/agentes'] },
      { label: 'Agente WhatsApp', href: '/agentes/whatsapp', icon: MessageSquareText },
      { label: 'Jornal Matinal', href: '/jornal-matinal', icon: Newspaper, badge: 'novo' },
    ],
  },
  {
    label: 'Sistema',
    items: [{ label: 'Configurações', href: '/configuracoes', icon: Settings }],
  },
]

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)
