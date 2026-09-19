import { Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useCrm } from '@/hooks/use-crm'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NotificationItem } from '@/types'

const TONE_DOT: Record<NotificationItem['tone'], string> = {
  info: 'bg-accent',
  positivo: 'bg-good',
  atencao: 'bg-serious',
  critico: 'bg-critical',
}

export function NotificationCenter() {
  const navigate = useNavigate()
  const { data, readNotification, readAllNotifications } = useCrm()
  const notifications = data?.notifications ?? []
  const unread = notifications.filter((item) => !item.read).length

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={unread ? `Notificações (${unread} não lidas)` : 'Notificações'}
          className={cn(
            'relative grid size-9 place-items-center rounded-lg text-fg-muted',
            'transition-colors duration-150 hover:bg-surface-hover hover:text-fg',
            'data-[state=open]:bg-surface-hover data-[state=open]:text-fg',
          )}
        >
          <Bell className="size-4" aria-hidden />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 grid min-w-[15px] place-items-center rounded-full bg-critical px-1 text-[9px] font-semibold leading-[15px] text-white">
              {unread}
            </span>
          ) : null}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-elevated-lg data-[state=open]:animate-slide-up"
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-fg">Notificações</p>
              <p className="text-[12px] text-fg-subtle">
                {unread ? `${unread} não lidas` : 'Tudo em dia'}
              </p>
            </div>
            {unread ? (
              <Button variant="ghost" size="sm" onClick={readAllNotifications}>
                <CheckCheck aria-hidden />
                Marcar todas
              </Button>
            ) : null}
          </header>

          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length ? (
              <ul className="divide-y divide-line">
                {notifications.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        readNotification(item.id)
                        if (item.href) navigate(item.href)
                      }}
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-surface-hover',
                        !item.read && 'bg-accent-soft/40',
                      )}
                    >
                      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', TONE_DOT[item.tone])} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-fg">{item.title}</span>
                        <span className="mt-0.5 block text-[12px] leading-relaxed text-fg-muted">
                          {item.description}
                        </span>
                        <span className="mt-1 block text-[11px] text-fg-subtle">
                          {formatRelative(item.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon={Bell} title="Nenhuma notificação" description="Você está em dia." />
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
