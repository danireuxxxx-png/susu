import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "icon" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium " +
  "whitespace-nowrap select-none transition-[transform,background-color,color,border-color,box-shadow] " +
  "duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] " +
  "disabled:pointer-events-none disabled:opacity-40 " +
  // The lift is 1px. Anything more reads as a toy.
  "hover:-translate-y-px active:translate-y-0 active:scale-[0.985]";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-on-ink rounded-full shadow-soft hover:bg-[#1d1d20] hover:shadow-medium",
  secondary:
    "bg-elevated text-ink rounded-full border border-line hover:border-line-strong hover:bg-surface shadow-soft",
  ghost:
    "bg-transparent text-ink rounded-full hover:bg-surface",
  icon:
    "bg-transparent text-ink rounded-full hover:bg-surface aspect-square p-0",
  danger:
    "bg-error text-on-ink rounded-full hover:brightness-110 shadow-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.9375rem]",
  lg: "h-14 px-8 text-base",
};

const iconSizes: Record<Size, string> = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        base,
        variants[variant],
        variant === "icon" ? iconSizes[size] : sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, "className" | "children">;

/** Same visual language as Button, but a real anchor — keeps middle-click,
 *  "open in new tab" and crawlability intact. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        base,
        variants[variant],
        variant === "icon" ? iconSizes[size] : sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
