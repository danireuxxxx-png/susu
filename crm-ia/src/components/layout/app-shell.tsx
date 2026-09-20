import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useCrm } from '@/hooks/use-crm'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { cn } from '@/lib/utils'
import { CURRENT_USER } from '@/mock/team'
import { CommandPalette } from './command-palette'
import { DataBoundary } from './data-boundary'
import { Logo } from './logo'
import { PageSkeleton } from './page-skeleton'
import { SidebarNav } from './sidebar-nav'
import { Topbar } from './topbar'
import { UserMenu } from './user-menu'

export function AppShell() {
  const { data } = useCrm()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useLocalStorage('iacentrism-sidebar-collapsed', false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const user = data?.currentUser ?? CURRENT_USER

  // Atalho global da busca: ⌘K / Ctrl+K.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => setMobileNavOpen(false), [pathname])

  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* Sidebar fixa (desktop) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col border-r border-line bg-surface lg:flex',
          'transition-[width] duration-200 ease-out',
          collapsed ? 'w-[68px]' : 'w-[248px]',
        )}
      >
        <div className={cn('flex h-14 items-center border-b border-line px-4', collapsed && 'justify-center px-0')}>
          <Logo compact={collapsed} />
        </div>
        <SidebarNav collapsed={collapsed} />
        <div className="border-t border-line p-2">
          <UserMenu user={user} collapsed={collapsed} />
        </div>
      </aside>

      {/* Drawer (mobile) */}
      <DialogPrimitive.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in lg:hidden" />
          <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-line bg-surface shadow-elevated-lg focus:outline-none lg:hidden">
            <DialogPrimitive.Title className="sr-only">Menu de navegação</DialogPrimitive.Title>
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <Logo />
              <DialogPrimitive.Close
                aria-label="Fechar menu"
                className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </DialogPrimitive.Close>
            </div>
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            <div className="border-t border-line p-2">
              <UserMenu user={user} />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <div className={cn('flex min-w-0 flex-1 flex-col', collapsed ? 'lg:pl-[68px]' : 'lg:pl-[248px]')}>
        <Topbar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onToggleSidebar={() => setCollapsed((current) => !current)}
          sidebarCollapsed={collapsed}
        />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <DataBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </DataBoundary>
        </main>
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
