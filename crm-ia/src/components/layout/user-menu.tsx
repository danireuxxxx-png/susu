import { ChevronsUpDown, LogOut, Settings, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSectionLabel,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/dropdown'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { TeamMember } from '@/types'

interface UserMenuProps {
  user: TeamMember
  collapsed?: boolean
}

export function UserMenu({ user, collapsed = false }: UserMenuProps) {
  const navigate = useNavigate()
  const { toast } = useToast()

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors duration-150',
            'hover:bg-surface-hover data-[state=open]:bg-surface-hover',
            collapsed && 'justify-center',
          )}
          aria-label="Abrir menu do perfil"
        >
          <Avatar name={user.name} color={user.avatarColor} size="sm" />
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-fg">{user.name}</span>
                <span className="block truncate text-[11px] text-fg-subtle">{user.role}</span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
            </>
          ) : null}
        </button>
      </DropdownTrigger>

      <DropdownContent align="start" className="w-60">
        <DropdownSectionLabel>{user.email}</DropdownSectionLabel>
        <DropdownItem onSelect={() => navigate('/configuracoes')}>
          <UserRound aria-hidden />
          Meu perfil
        </DropdownItem>
        <DropdownItem onSelect={() => navigate('/configuracoes')}>
          <Settings aria-hidden />
          Configurações
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          destructive
          onSelect={() =>
            toast({
              title: 'Sessão encerrada',
              description: 'A autenticação real entra na próxima etapa do projeto.',
              tone: 'neutro',
            })
          }
        >
          <LogOut aria-hidden />
          Sair
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  )
}
