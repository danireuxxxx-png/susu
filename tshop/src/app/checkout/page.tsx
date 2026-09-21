"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/product/product-image";
import { getProduct } from "@/lib/products";

/**
 * Order review — deliberately stops short of taking payment.
 *
 * Wiring a real checkout means a payment provider, server-side price
 * verification and an order record. Prices are recomputed from the cart here
 * for display only; a production flow must never trust a client-supplied
 * total. See README, "Antes de publicar".
 */
export default function CheckoutPage() {
  const cart = useCart();

  return (
    <div className="shell pt-32 sm:pt-40">
      <header className="flex max-w-2xl flex-col gap-4 pb-14">
        <p className="eyebrow flex items-center gap-3">
          <span aria-hidden className="inline-block h-px w-8 bg-accent" />
          Checkout
        </p>
        <h1 className="text-h1">Revise seu pedido.</h1>
      </header>

      {!cart.hydrated ? (
        <p className="py-20 text-ink-muted">Carregando sua sacola…</p>
      ) : cart.lines.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-line py-24 text-center">
          <p className="text-h3">Sua sacola está vazia</p>
          <ButtonLink href="/smartphones" variant="secondary">
            Explorar smartphones
          </ButtonLink>
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <ul className="flex flex-col divide-y divide-[color:var(--color-line)] border-y border-line">
            {cart.lines.map((line) => {
              const product = getProduct(line.slug);
              return (
                <li key={line.id} className="flex items-center gap-5 py-6">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface p-2">
                    {product && (
                      <ProductImage
                        product={product}
                        shadow={false}
                        sizes="80px"
                        label=""
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/produto/${line.slug}`}
                      className="link-underline font-medium"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-sm text-ink-muted">
                      {line.color} · {line.storage} · {line.quantity}{" "}
                      {line.quantity === 1 ? "unidade" : "unidades"}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">
                    {formatPrice(line.unitPrice * line.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-xl border border-line bg-elevated p-8">
              <h2 className="text-h3">Resumo</h2>

              <dl className="mt-6 flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-secondary">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(cart.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-secondary">Frete</dt>
                  <dd className="tabular-nums">
                    {cart.shipping === 0 ? "Grátis" : formatPrice(cart.shipping)}
                  </dd>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
                  <dt className="font-medium">Total</dt>
                  <dd className="text-2xl font-semibold tabular-nums tracking-[-0.03em]">
                    {formatPrice(cart.total)}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 rounded-lg bg-surface p-5">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="size-4 text-accent" aria-hidden />
                  Pagamento ainda não integrado
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                  Para concluir o pedido, finalize pelo Instagram ou por
                  telefone. A integração com o meio de pagamento é o próximo
                  passo do projeto.
                </p>
              </div>

              <ButtonLink href="/sobre#contato" size="lg" className="mt-6 w-full">
                Finalizar com a loja
              </ButtonLink>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
