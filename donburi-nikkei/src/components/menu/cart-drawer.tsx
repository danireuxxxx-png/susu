"use client";

import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { itemPorId } from "@/lib/data/menu";
import { formatCurrency, cn } from "@/lib/utils";
import { DishArt } from "@/components/icons/dish-illustrations";

export function CartDrawer() {
  const { linhas, subtotal, alterarQuantidade, remover, linkWhatsapp, cartAberto, fecharCart } =
    useCart();

  return (
    <AnimatePresence>
      {cartAberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fecharCart}
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-paper shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-vermillion" />
                <h2 className="font-display text-base text-ink">Seu pedido</h2>
              </div>
              <button
                onClick={fecharCart}
                aria-label="Fechar carrinho"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {linhas.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <ShoppingBag className="h-10 w-10 text-ink/15" />
                <p className="text-sm text-ink-soft">
                  Seu carrinho está vazio. Explore o cardápio e monte seu pedido.
                </p>
                <Link
                  href="/cardapio"
                  onClick={fecharCart}
                  className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-rice transition-colors hover:bg-vermillion"
                >
                  Ver cardápio
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <ul className="flex flex-col gap-4">
                    {linhas.map((linha) => {
                      const item = itemPorId(linha.itemId);
                      if (!item) return null;
                      return (
                        <li key={linha.itemId} className="flex gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                            <DishArt type={item.illustration} />
                          </div>
                          <div className="flex flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-ink leading-snug">
                                {item.nome}
                              </p>
                              <button
                                onClick={() => remover(linha.itemId)}
                                aria-label={`Remover ${item.nome}`}
                                className="text-ink/30 hover:text-vermillion"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="mt-0.5 text-xs text-ink-soft">
                              {formatCurrency(item.preco)} / un.
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={() => alterarQuantidade(linha.itemId, linha.quantidade - 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-ink hover:border-vermillion hover:text-vermillion"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-5 text-center text-sm font-medium">
                                {linha.quantidade}
                              </span>
                              <button
                                onClick={() => alterarQuantidade(linha.itemId, linha.quantidade + 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-ink hover:border-vermillion hover:text-vermillion"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <span className="ml-auto text-sm font-semibold text-ink">
                                {formatCurrency(item.preco * linha.quantidade)}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="border-t border-ink/10 px-5 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-ink-soft">Subtotal</span>
                    <span className="font-display text-lg text-ink">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <a
                    href={linkWhatsapp()}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-full bg-vermillion py-3.5 text-sm font-semibold text-rice",
                      "transition-transform hover:scale-[1.02] hover:bg-vermillion-dark"
                    )}
                  >
                    Finalizar pelo WhatsApp
                  </a>
                  <p className="mt-2 text-center text-[11px] text-ink-soft/70">
                    Taxa de entrega calculada pelo atendente.
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
