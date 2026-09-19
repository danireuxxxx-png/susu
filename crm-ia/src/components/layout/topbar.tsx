import { Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { NotificationCenter } from './notification-center'
import { ThemeToggle } from './theme-toggle'

interface TopbarProps {
  onOpenMobileNav: () => void
  onOpenSearch: () => void
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}

export function Topbar({
  onOpenMobileNav,
  onOpenSearch,
  onToggleSidebar,
  sidebarCollapsed,
}: TopbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line',
        'bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-3 backdrop-blur-md sm:px-5',
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Abrir menu"
      >
        <Menu aria-hidden />
      </Button>

      <Tooltip content={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {sidebarCollapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
        </Button>
      </Tooltip>

      <button
        type="button"
        onClick={onOpenSearch}
        className={cn(
          'group flex h-9 flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface-muted px-3',
          'text-left text-[13px] text-fg-subtle transition-colors duration-150',
          'hover:border-line-strong hover:bg-surface-hover sm:max-w-md',
        )}
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">Buscar no CRM...</span>
        <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium sm:flex">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-0.5">
        <NotificationCenter />
        <ThemeToggle />
      </div>
    </header>
  )
}
