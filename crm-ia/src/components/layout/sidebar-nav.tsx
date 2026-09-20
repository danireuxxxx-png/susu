import { NavLink, useLocation } from 'react-router-dom'
import { NAV_GROUPS } from '@/constants/navigation'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'

interface SidebarNavProps {
  collapsed?: boolean
  onNavigate?: () => void
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const { pathname } = useLocation()

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4 scrollbar-thin">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          {!collapsed ? (
            <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
              {group.label}
            </p>
          ) : (
            <div className="mx-auto my-2 h-px w-6 bg-line" aria-hidden />
          )}

          {group.items.map((item) => {
            // "/agentes" nao deve acender quando a rota e "/agentes/whatsapp".
            const active =
              pathname === item.href ||
              (item.href !== '/agentes' && pathname.startsWith(`${item.href}/`))

            const link = (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium',
                  'transition-colors duration-150',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-accent-soft text-accent-soft-fg'
                    : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {!collapsed ? (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-fg">
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                ) : null}
              </NavLink>
            )

            return collapsed ? (
              <Tooltip key={item.href} content={item.label} side="right">
                {link}
              </Tooltip>
            ) : (
              link
            )
          })}
        </div>
      ))}
    </nav>
  )
}
