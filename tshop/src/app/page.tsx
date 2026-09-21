import { Hero } from "@/components/sections/hero";
import { Showcase } from "@/components/sections/showcase";
import { Features } from "@/components/sections/features";
import { Offers } from "@/components/sections/offers";
import { Trust } from "@/components/sections/trust";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionTitle } from "@/components/ui/section-title";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { featuredProducts, heroProduct, onSale } from "@/lib/products";

export default function HomePage() {
  const hero = heroProduct();

  return (
    <>
      {/* 1 — HERO: the opening shot. */}
      <Hero product={hero} />

      {/* 2 — THE PRODUCT: pinned, scroll-driven, three chapters. */}
      <Showcase product={hero} />

      {/* 3 — TECHNOLOGY: what decides the daily experience. */}
      <Features />

      {/* 4 — CATALOGUE: the pieces, finally shown together. */}
      <section className="shell py-20 sm:py-28 lg:py-36" aria-labelledby="catalog-title">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle
            eyebrow="Destaques"
            title={<span id="catalog-title">Escolhidos a dedo.</span>}
            lead="Um catálogo curto por escolha. Cada aparelho aqui é um que recomendaríamos para alguém da família."
            className="max-w-xl"
          />
        </div>

        {/* A curated shelf, so phones get a rail to swipe rather than six
            full-height cards stacked into a scroll marathon. */}
        <ProductGrid
          products={featuredProducts(6)}
          className="mt-10 sm:mt-14"
          railOnMobile
        />

        <Reveal delay={120}>
          <div className="mt-10 flex justify-center sm:mt-12">
            <ButtonLink href="/smartphones" variant="secondary" size="lg">
              Ver todos os aparelhos
            </ButtonLink>
          </div>
        </Reveal>
      </section>

      {/* 5 — OFFERS: restraint, not a discount bin. */}
      <Offers products={onSale()} />

      {/* 6 — TRUST / FINAL CTA: the darkest frame, last. */}
      <Trust />
    </>
  );
}
