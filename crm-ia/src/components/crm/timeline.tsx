import {
  CalendarCheck,
  CircleDot,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { memberName } from '@/mock/team'
import type { TimelineEvent } from '@/types'

const ICONS: Record<TimelineEvent['type'], LucideIcon> = {
  criacao: Sparkles,
  ligacao: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  reuniao: CalendarCheck,
  'follow-up': RefreshCw,
  tarefa: CircleDot,
  estagio: CircleDot,
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-4 border-l border-line pl-6">
      {events.map((event) => {
        const Icon = ICONS[event.type] ?? CircleDot
        return (
          <li key={event.id} className="relative">
            <span className="absolute -left-[31px] grid size-[22px] place-items-center rounded-full border border-line bg-surface text-fg-subtle">
              <Icon className="size-3" aria-hidden />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="text-[13px] font-medium text-fg">{event.title}</p>
              <time className="text-[11px] text-fg-subtle" dateTime={event.date}>
                {formatDateTime(event.date)}
              </time>
            </div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-fg-muted">{event.description}</p>
            <p className="mt-1 text-[11px] text-fg-subtle">{memberName(event.authorId)}</p>
          </li>
        )
      })}
    </ol>
  )
}
