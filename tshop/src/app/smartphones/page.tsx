import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/product/catalog-browser";
import { Reveal } from "@/components/ui/reveal";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Smartphones",
  description:
    "Catálogo completo de smartphones originais com garantia. Apple, " +
    "Samsung, Xiaomi e Motorola, com condições de parcelamento.",
  alternates: { canonical: "/smartphones" },
};

export default function SmartphonesPage() {
  const list = products.filter((p) => p.category === "smartphones");
  const brands = [...new Set(list.map((p) => p.brand))];

  return (
    <div className="shell pt-32 sm:pt-40">
      <header className="flex max-w-2xl flex-col gap-5 pb-14">
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden className="inline-block h-px w-8 bg-accent" />
            Catálogo
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="text-h1">Smartphones.</h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="text-lead text-ink-secondary">
            Todos os aparelhos que vendemos, sem enchimento de catálogo. Filtre
            por marca, ordene por preço e compare o que importa.
          </p>
        </Reveal>
      </header>

      <Suspense fallback={<CatalogFallback />}>
        <CatalogBrowser products={list} brands={brands} />
      </Suspense>
    </div>
  );
}

/** Same geometry as the real grid, so the swap shifts nothing. */
function CatalogFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
