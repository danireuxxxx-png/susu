import { cn, initials } from '@/lib/utils'

const COLORS: Record<string, string> = {
  accent: 'bg-accent-soft text-accent-soft-fg',
  blue: 'bg-[#e4eefb] text-[#1c5cab] dark:bg-[#17263a] dark:text-[#9ec5f4]',
  aqua: 'bg-[#e0f4ec] text-[#0f6f4d] dark:bg-[#122a23] dark:text-[#6fd3ae]',
  orange: 'bg-[#fbe9e0] text-[#a8451c] dark:bg-[#33201a] dark:text-[#f2a583]',
  magenta: 'bg-[#fbe7ee] text-[#a83a63] dark:bg-[#301c26] dark:text-[#eda6c0]',
}

interface AvatarProps {
  name: string
  color?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-11 text-sm',
} as const

export function Avatar({ name, color = 'accent', size = 'sm', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-semibold select-none',
        COLORS[color] ?? COLORS.accent,
        SIZES[size],
        className,
      )}
      title={name}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
