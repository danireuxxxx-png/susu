import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface shadow-elevated-sm',
        'transition-colors duration-150',
        className,
      )}
      {...props}
    />
  )
}

interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function CardHeader({ title, description, action, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3', className)}
      {...props}
    >
      <div className="min-w-0">
        <h3 className="text-sm font-semibold tracking-tight text-fg">{title}</h3>
        {description ? <p className="mt-1 text-[13px] text-fg-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between gap-3 border-t border-line px-5 py-3', className)}
      {...props}
    />
  )
}
