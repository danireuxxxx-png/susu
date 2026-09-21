import type { Product } from "@/lib/types";
import { Reveal } from "@/components/ui/reveal";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  className?: string;
  /** Column count at the widest breakpoint. */
  columns?: 3 | 4;
  emptyState?: React.ReactNode;
};

export function ProductGrid({
  products,
  className,
  columns = 3,
  emptyState,
}: Props) {
  if (products.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <ul
      className={cn(
        "grid gap-4 sm:gap-6",
        "grid-cols-1 sm:grid-cols-2",
        columns === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {products.map((product, i) => (
        <Reveal
          as="li"
          key={product.slug}
          /* Cap the stagger: past the fourth card the delay stops reading as
             rhythm and starts reading as lag. */
          delay={Math.min(i, 3) * 90}
          className="flex"
        >
          <ProductCard
            product={product}
            index={i}
            priority={i < 2}
            className="w-full"
          />
        </Reveal>
      ))}
    </ul>
  );
}
