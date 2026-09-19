import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150',
    'disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg shadow-elevated-sm hover:bg-accent-hover',
        secondary:
          'border border-line bg-surface text-fg shadow-elevated-sm hover:border-line-strong hover:bg-surface-hover',
        ghost: 'text-fg-muted hover:bg-surface-hover hover:text-fg',
        subtle: 'bg-surface-inset text-fg hover:bg-surface-hover',
        soft: 'bg-accent-soft text-accent-soft-fg hover:brightness-[0.97]',
        danger: 'bg-critical text-white shadow-elevated-sm hover:brightness-95',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-[13px] [&_svg]:size-3.5',
        md: 'h-9 px-3.5 text-sm [&_svg]:size-4',
        lg: 'h-10 px-4 text-sm [&_svg]:size-4',
        icon: 'size-9 [&_svg]:size-4',
        'icon-sm': 'size-8 [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {children}
        </>
      ) : (
        children
      )}
    </Component>
  )
}
