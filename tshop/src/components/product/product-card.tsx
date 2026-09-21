"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { Price } from "@/components/ui/price";
import { ProductImage } from "./product-image";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  /** Feeds the entrance stagger when cards appear in a grid. */
  index?: number;
  className?: string;
  priority?: boolean;
};

export function ProductCard({ product, className, priority }: Props) {
  const soldOut = product.stock === 0;
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl",
        "border border-line bg-elevated",
        "transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:-translate-y-1.5 hover:border-line-strong hover:shadow-large",
        "motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {/* Stage: the product sits on its own pool of light. */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,#ffffff_0%,transparent_68%)]"
        />

        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center p-[14%]",
            "transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            "group-hover:scale-[1.045] motion-reduce:group-hover:scale-100",
            soldOut && "opacity-45 saturate-50",
          )}
        >
          <ProductImage
            product={product}
            priority={priority}
            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 24vw"
            label=""
          />
        </div>

        {(discount || soldOut) && (
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {soldOut ? (
              <Badge tone="muted">Indisponível</Badge>
            ) : (
              <Badge tone="accent">−{discount}%</Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{product.brand}</p>
          <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-[-0.02em]">
            {/* The whole card is the hit area, via this stretched link. */}
            <Link
              href={`/produto/${product.slug}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {product.name}
            </Link>
          </h3>
          <p className="text-sm leading-relaxed text-ink-muted">
            {product.tagline}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <Price
            value={product.price}
            compareAt={product.compareAtPrice}
            installments={product.installments}
            size="md"
          />

          <span
            aria-hidden
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full",
              "border border-line text-ink",
              "transition-[background-color,color,transform] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
              "group-hover:bg-ink group-hover:text-on-ink group-hover:border-ink",
            )}
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}

function Badge({
  children,
  tone = "accent",
}: {
  children: React.ReactNode;
  tone?: "accent" | "muted";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase",
        "backdrop-blur-sm",
        tone === "accent"
          ? "bg-accent text-white"
          : "bg-ink/70 text-on-ink",
      )}
    >
      {children}
    </span>
  );
}
