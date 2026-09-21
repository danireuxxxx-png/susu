import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-grid";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { onSale } from "@/lib/products";

export const metadata: Metadata = {
  title: "Ofertas",
  description:
    "Seleção especial com condições por tempo limitado, em aparelhos " +
    "originais e com garantia.",
  alternates: { canonical: "/ofertas" },
};

export default function OfertasPage() {
  const deals = onSale();

  return (
    <div className="shell pt-32 sm:pt-40">
      <header className="flex max-w-2xl flex-col gap-5 pb-14">
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden className="inline-block h-px w-8 bg-accent" />
            Seleção especial
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="text-h1">Condições especiais.</h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="text-lead text-ink-secondary">
            Um recorte curto do catálogo, com desconto real sobre o preço
            praticado. Enquanto durarem os estoques.
          </p>
        </Reveal>
      </header>

      <ProductGrid
        products={deals}
        emptyState={
          <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-line py-24 text-center">
            <p className="text-h3">Sem ofertas ativas no momento</p>
            <p className="max-w-[42ch] text-sm text-ink-secondary">
              Assine a lista e avisamos assim que a próxima seleção entrar.
            </p>
            <ButtonLink href="/smartphones" variant="secondary">
              Ver catálogo completo
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
