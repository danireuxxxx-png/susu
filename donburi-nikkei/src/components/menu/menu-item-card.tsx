"use client";

import { motion } from "motion/react";
import { Check, Plus } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { DishArt } from "@/components/icons/dish-illustrations";
import { TagBadge } from "@/components/menu/tag-badge";
import { formatCurrency, cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";

export function MenuItemCard({
  item,
  onOpen,
}: {
  item: MenuItem;
  onOpen: (item: MenuItem) => void;
}) {
  const { adicionar, ultimoAdicionado } = useCart();
  const acabouDeAdicionar = ultimoAdicionado === item.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="group flex gap-4 rounded-2xl border border-ink/8 bg-paper p-4 transition-all hover:border-vermillion/30 hover:shadow-md"
    >
      <button
        onClick={() => onOpen(item)}
        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl transition-transform group-hover:scale-105 sm:h-24 sm:w-24"
        aria-label={`Ver detalhes de ${item.nome}`}
      >
        <DishArt type={item.illustration} />
      </button>

      <div className="flex flex-1 flex-col">
        <button onClick={() => onOpen(item)} className="text-left">
          <h3 className="font-display text-[15px] leading-snug text-ink sm:text-base">
            {item.nome}
          </h3>
        </button>

        {item.tags && item.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-soft sm:text-[13px]">
          {item.descricao}
        </p>

        <div className="mt-2.5 flex items-center justify-between">
          <span className="font-display text-base text-ink">
            {formatCurrency(item.preco)}
          </span>
          <button
            onClick={() => adicionar(item.id, 1)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all",
              acabouDeAdicionar
                ? "bg-matcha text-rice"
                : "bg-ink text-rice hover:bg-vermillion active:scale-90"
            )}
            aria-label={`Adicionar ${item.nome} ao carrinho`}
          >
            {acabouDeAdicionar ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
