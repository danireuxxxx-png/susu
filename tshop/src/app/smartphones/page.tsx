import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/product/catalog-browser";
import { Reveal } from "@/components/ui/reveal";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Smartphones",
  description:
    "Catálogo completo de smartphones originais com garantia. Apple, " +
    "Samsung, Xiaomi e Motorola, com condições de parcelamento.",
  alternates: { canonical: "/smartphones" },
};

export default async function SmartphonesPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string }>;
}) {
  const { marca } = await searchParams;
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

      <CatalogBrowser
        products={list}
        brands={brands}
        initialBrand={marca}
      />
    </div>
  );
}
