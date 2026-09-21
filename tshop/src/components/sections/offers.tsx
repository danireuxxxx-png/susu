import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { Reveal } from "@/components/ui/reveal";
import { Rail } from "@/components/ui/rail";
import { ProductImage } from "@/components/product/product-image";
import { Price } from "@/components/ui/price";
import { ButtonLink } from "@/components/ui/button";

/**
 * Offers without the discount-bin vocabulary: no sirens, no countdown, no
 * red. The saving is stated once, in the accent, and the product still gets
 * the space. Scarcity here is communicated by restraint.
 */
export function Offers({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  const [lead, ...rest] = products;

  return (
    <section className="shell py-20 sm:py-28 lg:py-36" aria-labelledby="offers-title">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4">
          <Reveal>
            <p className="eyebrow flex items-center gap-3">
              <span aria-hidden className="inline-block h-px w-8 bg-accent" />
              Seleção especial
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 id="offers-title" className="text-h2 max-w-[16ch]">
              Condições especiais, por tempo limitado.
            </h2>
          </Reveal>
        </div>

        <Reveal delay={160}>
          <Link
            href="/ofertas"
            className="link-underline inline-flex min-h-11 items-center gap-2 text-sm text-ink-secondary transition-colors hover:text-ink sm:min-h-0"
          >
            Ver todas as ofertas
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </div>

      <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Lead offer: full-bleed stage, product at scale. */}
        <Reveal>
          <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="relative flex-1 overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_62%_34%,#ffffff_0%,transparent_66%)]"
              />
              <div className="relative flex min-h-[20rem] items-center justify-center p-10 sm:min-h-[26rem]">
                <div className="aspect-[440/900] h-[18rem] transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] motion-reduce:group-hover:scale-100 sm:h-[24rem]">
                  <ProductImage
                    product={lead}
                    sizes="(max-width: 1024px) 60vw, 30vw"
                    label=""
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 border-t border-line bg-elevated p-8 sm:flex-row sm:items-end sm:justify-between sm:p-10">
              <div className="flex flex-col gap-2">
                <p className="eyebrow">{lead.brand}</p>
                <h3 className="text-h3">
                  <Link
                    href={`/produto/${lead.slug}`}
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    {lead.name}
                  </Link>
                </h3>
                <p className="max-w-[36ch] text-sm text-ink-secondary">
                  {lead.tagline}
                </p>
              </div>

              <Price
                value={lead.price}
                compareAt={lead.compareAtPrice}
                installments={lead.installments}
                size="md"
                className="sm:items-end sm:text-right"
              />
            </div>
          </article>
        </Reveal>

        {/* Supporting offers: a rail on phones, a ranked column on desktop. */}
        <Rail
          label="Outras ofertas"
          gridClassName="sm:flex sm:flex-col sm:gap-4 lg:gap-6"
          itemClassName="sm:flex-1"
        >
          {rest.slice(0, 3).map((product, i) => (
            <Reveal key={product.slug} delay={(i + 1) * 90} className="flex-1">
              <article className="group relative flex h-full items-center gap-5 overflow-hidden rounded-xl border border-line bg-elevated p-5 transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-line-strong hover:shadow-medium motion-reduce:hover:translate-y-0 sm:p-6">
                <div className="relative aspect-[440/900] h-24 shrink-0 py-1 sm:h-28">
                  <ProductImage
                    product={product}
                    shadow={false}
                    sizes="80px"
                    label=""
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="eyebrow">{product.brand}</p>
                  <h3 className="truncate font-semibold tracking-[-0.02em]">
                    <Link
                      href={`/produto/${product.slug}`}
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <Price
                    value={product.price}
                    compareAt={product.compareAtPrice}
                    size="sm"
                  />
                </div>

                <ArrowRight
                  className="size-4 shrink-0 text-ink-faint transition-[transform,color] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:text-ink"
                  aria-hidden
                />
              </article>
            </Reveal>
          ))}
        </Rail>
      </div>

      <Reveal delay={240}>
        <p className="mt-8 max-w-[52ch] text-sm text-ink-muted sm:mt-10">
          Condições válidas enquanto durarem os estoques. Consulte a loja
          para prazos, formas de pagamento e disponibilidade de cada
          configuração.
        </p>
      </Reveal>

      <Reveal delay={300}>
        <div className="mt-8">
          <ButtonLink href="/ofertas" variant="secondary">
            Ver seleção completa
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
