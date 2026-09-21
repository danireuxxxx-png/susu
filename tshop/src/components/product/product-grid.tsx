"use client";

import type { Product } from "@/lib/types";
import { Reveal } from "@/components/ui/reveal";
import { Rail } from "@/components/ui/rail";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  className?: string;
  /** Column count at the widest breakpoint. */
  columns?: 3 | 4;
  emptyState?: React.ReactNode;
  /**
   * On phones, lay the products out as a swipeable rail instead of one tall
   * column. Right for a curated shelf on the home page; wrong for a
   * catalogue, where the visitor came to scan everything.
   */
  railOnMobile?: boolean;
};

export function ProductGrid({
  products,
  className,
  columns = 3,
  emptyState,
  railOnMobile = false,
}: Props) {
  if (products.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const cards = products.map((product, i) => (
    <Reveal
      key={product.slug}
      /* Cap the stagger: past the fourth card the delay stops reading as
         rhythm and starts reading as lag. */
      delay={Math.min(i, 3) * 90}
      className="flex w-full"
    >
      <ProductCard product={product} index={i} priority={i < 2} className="w-full" />
    </Reveal>
  ));

  const gridCols = columns === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3";

  if (railOnMobile) {
    return (
      <Rail
        label="Produtos em destaque"
        className={className}
        gridClassName={cn("sm:grid sm:grid-cols-2", gridCols)}
      >
        {cards}
      </Rail>
    );
  }

  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6",
        gridCols,
        className,
      )}
    >
      {cards.map((card, i) => (
        <li key={products[i].slug} className="flex">
          {card}
        </li>
      ))}
    </ul>
  );
}
