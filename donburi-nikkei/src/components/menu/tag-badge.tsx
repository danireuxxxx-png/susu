import { Leaf, Flame, Sparkles, TrendingUp } from "lucide-react";
import type { MenuTag } from "@/lib/types";
import { cn } from "@/lib/utils";

const config: Record<MenuTag, { label: string; icon: typeof Leaf; className: string }> = {
  vegetariano: {
    label: "Vegetariano",
    icon: Leaf,
    className: "bg-matcha-soft text-matcha",
  },
  picante: {
    label: "Picante",
    icon: Flame,
    className: "bg-vermillion/10 text-vermillion",
  },
  "mais-pedido": {
    label: "Mais pedido",
    icon: TrendingUp,
    className: "bg-gold-soft/60 text-vermillion-dark",
  },
  novo: {
    label: "Novo",
    icon: Sparkles,
    className: "bg-ink/8 text-ink",
  },
};

export function TagBadge({ tag, className }: { tag: MenuTag; className?: string }) {
  const { label, icon: Icon, className: colorClassName } = config[tag];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
        colorClassName,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
