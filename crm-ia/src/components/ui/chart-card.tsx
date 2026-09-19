import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardBody, CardHeader } from './card'

interface ChartCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  bodyClassName?: string
}

export function ChartCard({
  title,
  description,
  action,
  children,
  footer,
  className,
  bodyClassName,
}: ChartCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader title={title} description={description} action={action} />
      <CardBody className={cn('flex-1 pb-4', bodyClassName)}>{children}</CardBody>
      {footer ? <div className="border-t border-line px-5 py-3 text-[13px] text-fg-muted">{footer}</div> : null}
    </Card>
  )
}
