import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Dropdown = DropdownPrimitive.Root
export const DropdownTrigger = DropdownPrimitive.Trigger
export const DropdownLabel = DropdownPrimitive.Label

export function DropdownContent({
  className,
  align = 'end',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-48 overflow-hidden rounded-xl border border-line bg-surface p-1.5',
          'shadow-elevated-lg data-[state=open]:animate-slide-up',
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  )
}

export function DropdownItem({
  className,
  destructive = false,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Item> & { destructive?: boolean }) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]',
        'outline-none transition-colors duration-100',
        'data-[highlighted]:bg-surface-hover',
        destructive ? 'text-critical data-[highlighted]:bg-critical-soft' : 'text-fg',
        '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-subtle',
        destructive && '[&_svg]:text-critical',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownSeparator({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Separator>) {
  return <DropdownPrimitive.Separator className={cn('my-1.5 h-px bg-line', className)} {...props} />
}

export function DropdownSectionLabel({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn('px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-subtle', className)}
      {...props}
    />
  )
}
