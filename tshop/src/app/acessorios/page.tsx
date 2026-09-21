import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/product/catalog-browser";
import { Reveal } from "@/components/ui/reveal";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Acessórios",
  description:
    "Fones, carregadores e capas selecionados para durar tanto quanto o " +
    "aparelho.",
  alternates: { canonical: "/acessorios" },
};

export default function AcessoriosPage() {
  const list = products.filter((p) => p.category === "acessorios");

  return (
    <div className="shell pt-32 sm:pt-40">
      <header className="flex max-w-2xl flex-col gap-5 pb-14">
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden className="inline-block h-px w-8 bg-accent" />
            Complementos
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="text-h1">Acessórios.</h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="text-lead text-ink-secondary">
            O que vale a pena comprar junto — e nada além disso.
          </p>
        </Reveal>
      </header>

      <Suspense fallback={null}>
        <CatalogBrowser products={list} brands={[]} />
      </Suspense>
    </div>
  );
}
