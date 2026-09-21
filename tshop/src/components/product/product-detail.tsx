"use client";

import { useMemo, useState } from "react";
import { Check, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { ProductGallery } from "./product-gallery";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/cart/cart-drawer";
import { cn, formatInstallment, formatPrice } from "@/lib/utils";

export function ProductDetail({ product }: { product: Product }) {
  const [colorIndex, setColorIndex] = useState(0);
  const [storageIndex, setStorageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const cart = useCart();

  const color = product.colors[colorIndex];
  const storage = product.storage[storageIndex];
  const price = product.price + storage.priceDelta;
  const compareAt = product.compareAtPrice
    ? product.compareAtPrice + storage.priceDelta
    : undefined;
  const soldOut = product.stock === 0;

  // The selected colour drives the render's materials, so the preview
  // changes with the swatch instead of ignoring it.
  const colorOverride = useMemo(() => color.render, [color]);

  const addToCart = () => {
    cart.add({
      slug: product.slug,
      name: product.name,
      color: color.name,
      storage: storage.label,
      unitPrice: price,
      quantity,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <ProductGallery product={product} colorOverride={colorOverride} />
      </div>

      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="eyebrow">{product.brand}</p>
          <h1 className="text-h1">{product.name}</h1>
          <p className="text-lead text-ink-secondary">{product.tagline}</p>
        </header>

        <div className="flex flex-col gap-1">
          {compareAt && (
            <div className="flex items-center gap-2.5 text-sm">
              <span className="text-ink-faint line-through tabular-nums">
                {formatPrice(compareAt)}
              </span>
              <span className="font-medium text-accent">
                −{Math.round((1 - price / compareAt) * 100)}%
              </span>
            </div>
          )}
          <p className="text-4xl font-semibold tracking-[-0.04em] tabular-nums sm:text-5xl">
            {formatPrice(price)}
          </p>
          <p className="text-sm text-ink-muted tabular-nums">
            ou {formatInstallment(price, product.installments)} sem juros
          </p>
        </div>

        <p className="max-w-[48ch] leading-relaxed text-ink-secondary">
          {product.description}
        </p>

        {/* Colour ---------------------------------------------------------- */}
        <fieldset className="flex flex-col gap-4">
          <legend className="eyebrow mb-1">
            Cor — <span className="text-ink">{color.name}</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((option, i) => (
              <button
                key={option.name}
                type="button"
                onClick={() => setColorIndex(i)}
                aria-pressed={i === colorIndex}
                aria-label={option.name}
                title={option.name}
                className={cn(
                  "grid size-11 place-items-center rounded-full border-2 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  i === colorIndex
                    ? "border-ink"
                    : "border-transparent hover:border-line-strong",
                )}
              >
                <span
                  aria-hidden
                  className="size-7 rounded-full ring-1 ring-inset ring-black/10"
                  style={{
                    background: `linear-gradient(135deg, ${option.swatch[0]}, ${option.swatch[1]})`,
                  }}
                />
              </button>
            ))}
          </div>
        </fieldset>

        {/* Storage --------------------------------------------------------- */}
        {product.storage.length > 1 && (
          <fieldset className="flex flex-col gap-4">
            <legend className="eyebrow mb-1">Armazenamento</legend>
            <div className="grid grid-cols-3 gap-3">
              {product.storage.map((option, i) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setStorageIndex(i)}
                  aria-pressed={i === storageIndex}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border px-3 py-4",
                    "transition-[border-color,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    i === storageIndex
                      ? "border-ink bg-surface"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs tabular-nums text-ink-muted">
                    {option.priceDelta === 0
                      ? formatPrice(product.price)
                      : `+ ${formatPrice(option.priceDelta)}`}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* Buy box --------------------------------------------------------- */}
        <div className="flex flex-col gap-4 border-t border-line pt-8">
          {soldOut ? (
            <div className="rounded-lg border border-dashed border-line bg-surface p-6 text-center">
              <p className="font-medium">Indisponível no momento</p>
              <p className="mt-1.5 text-sm text-ink-secondary">
                Fale com a loja para saber a previsão de reposição.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <QuantityStepper
                  value={quantity}
                  onChange={(q) => setQuantity(Math.max(1, q))}
                  label={product.name}
                  max={Math.min(product.stock, 10)}
                />
                {product.stock <= 5 && (
                  <p className="text-sm text-accent">
                    Últimas {product.stock} unidades
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={addToCart}
                  className="flex-1"
                  aria-live="polite"
                >
                  {justAdded ? (
                    <>
                      <Check className="size-4" aria-hidden />
                      Adicionado
                    </>
                  ) : (
                    "Adicionar à sacola"
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    addToCart();
                    cart.open();
                  }}
                  className="flex-1"
                >
                  Comprar agora
                </Button>
              </div>
            </>
          )}

          <ul className="mt-2 flex flex-col gap-3 text-sm text-ink-secondary">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden />
              Produto original com garantia
            </li>
            <li className="flex items-center gap-2.5">
              <Truck className="size-4 shrink-0 text-accent" aria-hidden />
              Envio rastreado — grátis acima de {formatPrice(2000)}
            </li>
          </ul>
        </div>

        {/* Highlights ------------------------------------------------------ */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line pt-8">
          {product.highlights.map((h) => (
            <div key={h.label}>
              <dt className="eyebrow">{h.label}</dt>
              <dd className="mt-1.5 text-2xl font-semibold tracking-[-0.035em]">
                {h.value}
              </dd>
              <dd className="mt-1 text-xs leading-relaxed text-ink-muted">
                {h.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
