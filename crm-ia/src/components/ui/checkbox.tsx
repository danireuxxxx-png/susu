import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'grid size-[18px] shrink-0 place-items-center rounded-[5px] border border-line-strong bg-surface',
        'transition-colors duration-150 hover:border-accent',
        'data-[state=checked]:border-accent data-[state=checked]:bg-accent',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-accent-fg">
        <Check className="size-3 stroke-[3]" aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
