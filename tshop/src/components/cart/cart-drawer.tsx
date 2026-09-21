"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD, useCart } from "@/hooks/use-cart";
import { Overlay } from "@/components/ui/overlay";
import { Button, ButtonLink } from "@/components/ui/button";
import { getProduct } from "@/lib/products";
import { ProductImage } from "@/components/product/product-image";
import { formatPrice, formatInstallment } from "@/lib/utils";

export function CartDrawer() {
  const cart = useCart();
  const remaining = FREE_SHIPPING_THRESHOLD - cart.subtotal;
  const progress = Math.min(cart.subtotal / FREE_SHIPPING_THRESHOLD, 1);

  return (
    <Overlay
      open={cart.isOpen}
      onClose={cart.close}
      title="Sua sacola"
      footer={cart.lines.length > 0 ? <Summary /> : undefined}
    >
      {cart.lines.length === 0 ? (
        <EmptyState onClose={cart.close} />
      ) : (
        <>
          {/* Progress toward free shipping — a nudge, not a nag. */}
          <div className="border-b border-line px-6 py-5">
            <p className="text-sm text-ink-secondary">
              {remaining > 0 ? (
                <>
                  Faltam{" "}
                  <strong className="font-semibold text-ink">
                    {formatPrice(remaining)}
                  </strong>{" "}
                  para frete grátis.
                </>
              ) : (
                <span className="font-medium text-ink">
                  Frete grátis liberado.
                </span>
              )}
            </p>
            <div
              className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-surface-strong"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-label="Progresso para frete grátis"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          <ul className="divide-y divide-[color:var(--color-line)]">
            {cart.lines.map((line) => {
              const product = getProduct(line.slug);
              return (
                <li key={line.id} className="flex gap-4 px-6 py-5">
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

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/produto/${line.slug}`}
                          onClick={cart.close}
                          className="link-underline block truncate text-sm font-semibold"
                        >
                          {line.name}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                          {line.color} · {line.storage}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => cart.remove(line.id)}
                        aria-label={`Remover ${line.name} da sacola`}
                        className="-m-1 rounded-full p-1 text-ink-faint transition-colors hover:text-error"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <QuantityStepper
                        value={line.quantity}
                        label={line.name}
                        onChange={(q) => cart.setQuantity(line.id, q)}
                      />
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPrice(line.unitPrice * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Overlay>
  );
}

function Summary() {
  const cart = useCart();

  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-2 text-sm">
        <Row label="Subtotal" value={formatPrice(cart.subtotal)} />
        <Row
          label="Frete"
          value={cart.shipping === 0 ? "Grátis" : formatPrice(cart.shipping)}
          muted={cart.shipping === 0}
        />
        <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-medium">Total</dt>
          <dd className="text-xl font-semibold tabular-nums tracking-[-0.02em]">
            {formatPrice(cart.total)}
          </dd>
        </div>
      </dl>

      <p className="text-xs text-ink-muted">
        ou {formatInstallment(cart.total, 12)} sem juros
      </p>

      <ButtonLink href="/checkout" size="lg" className="w-full">
        Finalizar compra
      </ButtonLink>

      <Button variant="ghost" size="sm" onClick={cart.close}>
        Continuar comprando
      </Button>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className={muted ? "font-medium text-success" : "tabular-nums"}>
        {value}
      </dd>
    </div>
  );
}

export function QuantityStepper({
  value,
  onChange,
  label,
  max = 10,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  max?: number;
}) {
  return (
    <div className="flex shrink-0 items-center rounded-full border border-line">
      <StepButton
        onClick={() => onChange(value - 1)}
        label={`Diminuir quantidade de ${label}`}
        disabled={value <= 1}
      >
        <Minus className="size-3.5" aria-hidden />
      </StepButton>
      <span
        className="min-w-7 text-center text-sm tabular-nums"
        aria-live="polite"
        aria-label={`Quantidade: ${value}`}
      >
        {value}
      </span>
      <StepButton
        onClick={() => onChange(value + 1)}
        label={`Aumentar quantidade de ${label}`}
        disabled={value >= max}
      >
        <Plus className="size-3.5" aria-hidden />
      </StepButton>
    </div>
  );
}

function StepButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent sm:size-9"
    >
      {children}
    </button>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-surface">
        <ShoppingBag className="size-6 text-ink-muted" aria-hidden />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-h3">Sua sacola está vazia</p>
        <p className="text-sm text-ink-secondary">
          Escolha um aparelho e ele aparece aqui.
        </p>
      </div>
      <ButtonLink href="/smartphones" onClick={onClose} variant="secondary">
        Explorar smartphones
      </ButtonLink>
    </div>
  );
}
