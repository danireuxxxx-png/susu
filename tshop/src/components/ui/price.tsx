import { formatInstallment, formatPrice, cn } from "@/lib/utils";

type Props = {
  value: number;
  compareAt?: number;
  installments?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { price: "text-base", compare: "text-xs", note: "text-xs" },
  md: { price: "text-xl", compare: "text-sm", note: "text-sm" },
  lg: { price: "text-4xl sm:text-5xl", compare: "text-base", note: "text-sm" },
} as const;

export function Price({
  value,
  compareAt,
  installments,
  size = "md",
  className,
}: Props) {
  const s = sizes[size];
  const discount = compareAt
    ? Math.round((1 - value / compareAt) * 100)
    : null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {compareAt && (
        <div className={cn("flex items-center gap-2", s.compare)}>
          <span className="text-ink-faint line-through">
            {formatPrice(compareAt)}
          </span>
          {discount !== null && discount > 0 && (
            <span className="text-accent font-medium">−{discount}%</span>
          )}
        </div>
      )}

      <span
        className={cn(
          "font-semibold tracking-[-0.03em] tabular-nums text-ink",
          s.price,
        )}
      >
        {formatPrice(value)}
      </span>

      {installments && installments > 1 && (
        <span className={cn("text-ink-muted tabular-nums", s.note)}>
          ou {formatInstallment(value, installments)} sem juros
        </span>
      )}
    </div>
  );
}
