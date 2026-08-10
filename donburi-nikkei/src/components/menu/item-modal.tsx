"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, X, Users } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { DishArt } from "@/components/icons/dish-illustrations";
import { TagBadge } from "@/components/menu/tag-badge";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";

export function ItemModal({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const { adicionar, abrirCart } = useCart();
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");

  const fechar = () => {
    onClose();
    setQuantidade(1);
    setObservacao("");
  };

  const confirmar = () => {
    if (!item) return;
    adicionar(item.id, quantidade, observacao.trim() || undefined);
    fechar();
    abrirCart();
  };

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fechar}
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
          >
            <div className="relative">
              <button
                onClick={fechar}
                aria-label="Fechar"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-ink shadow-md backdrop-blur"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="flex justify-center bg-rice-dim px-8 pb-6 pt-10">
                <div className="h-36 w-36">
                  <DishArt type={item.illustration} />
                </div>
              </div>

              <div className="px-6 pb-6 pt-5 sm:px-8">
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                )}

                <h2 className="mt-2.5 font-display text-2xl text-ink">{item.nome}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {item.descricao}
                </p>

                {item.serve && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft/80">
                    <Users className="h-3.5 w-3.5" />
                    Serve {item.serve}
                  </p>
                )}

                <p className="mt-4 font-display text-2xl text-vermillion">
                  {formatCurrency(item.preco)}
                </p>

                <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Alguma observação?
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: sem cebola, ponto da carne, sem pimenta…"
                  rows={2}
                  className="mt-2 w-full resize-none rounded-xl border border-ink/12 bg-rice px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-vermillion"
                />

                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-3 rounded-full border border-ink/12 px-2 py-1.5">
                    <button
                      onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink hover:bg-ink/5"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-4 text-center text-sm font-semibold">
                      {quantidade}
                    </span>
                    <button
                      onClick={() => setQuantidade((q) => q + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink hover:bg-ink/5"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={confirmar}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-vermillion py-3.5 text-sm font-semibold text-rice transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    Adicionar · {formatCurrency(item.preco * quantidade)}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
