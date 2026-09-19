import type { TeamMember } from '@/types'

/** O usuario logado e sempre o primeiro item — placeholder ate existir auth real. */
export const TEAM: TeamMember[] = [
  { id: 'user-1', name: 'Danilo Reux', role: 'Founder & Head Comercial', email: 'danilo@nexo.ai', avatarColor: 'accent' },
  { id: 'user-2', name: 'Marina Duarte', role: 'Executiva de Contas', email: 'marina@nexo.ai', avatarColor: 'blue' },
  { id: 'user-3', name: 'Rafael Nunes', role: 'SDR Sênior', email: 'rafael@nexo.ai', avatarColor: 'aqua' },
  { id: 'user-4', name: 'Bianca Mota', role: 'Customer Success', email: 'bianca@nexo.ai', avatarColor: 'orange' },
  { id: 'user-5', name: 'Caio Ferraz', role: 'Consultor de Soluções', email: 'caio@nexo.ai', avatarColor: 'magenta' },
]

export const CURRENT_USER = TEAM[0]!

export const TEAM_BY_ID = Object.fromEntries(TEAM.map((member) => [member.id, member]))

export function memberName(id: string) {
  return TEAM_BY_ID[id]?.name ?? 'Não atribuído'
}
