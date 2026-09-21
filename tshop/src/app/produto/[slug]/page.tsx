import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionTitle } from "@/components/ui/section-title";
import { Reveal } from "@/components/ui/reveal";
import { getProduct, products } from "@/lib/products";
import { SITE_URL } from "@/app/layout";
import { store } from "@/lib/store";

type Params = { params: Promise<{ slug: string }> };

/** Every product is known at build time — pre-render all of them. */
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) return { title: "Produto não encontrado" };

  return {
    title: product.name,
    description: `${product.tagline} ${product.description}`.slice(0, 160),
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} · ${store.name}`,
      description: product.tagline,
      url: `${SITE_URL}/produto/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) notFound();

  const related = products
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .slice(0, 3);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/produto/${product.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name:
          product.category === "smartphones" ? "Smartphones" : "Acessórios",
        item: `${SITE_URL}/${
          product.category === "smartphones" ? "smartphones" : "acessorios"
        }`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/produto/${product.slug}`,
      },
    ],
  };

  return (
    <div className="shell pt-28 sm:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav aria-label="Trilha de navegação" className="mb-10">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
          <li>
            <Link href="/" className="link-underline hover:text-ink">
              Início
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden />
          <li>
            <Link
              href={
                product.category === "smartphones"
                  ? "/smartphones"
                  : "/acessorios"
              }
              className="link-underline hover:text-ink"
            >
              {product.category === "smartphones" ? "Smartphones" : "Acessórios"}
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden />
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <ProductDetail product={product} />

      {/* Specifications */}
      <section className="mt-32" aria-labelledby="specs-title">
        <SectionTitle
          eyebrow="Ficha técnica"
          title={<span id="specs-title">Tudo, em detalhe.</span>}
          className="max-w-xl"
        />

        <div className="mt-12 grid gap-x-16 gap-y-12 sm:grid-cols-2">
          {product.specs.map((group, i) => (
            <Reveal key={group.group} delay={i * 80}>
              <h3 className="eyebrow border-b border-line pb-4">
                {group.group}
              </h3>
              <dl className="mt-1">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-baseline justify-between gap-6 border-b border-line py-4"
                  >
                    <dt className="text-sm text-ink-muted">{item.label}</dt>
                    <dd className="text-right text-sm font-medium">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-32" aria-labelledby="related-title">
          <SectionTitle
            eyebrow="Também vale olhar"
            title={<span id="related-title">Alternativas na mesma faixa.</span>}
            className="max-w-xl"
          />
          <ProductGrid products={related} className="mt-12" />
        </section>
      )}
    </div>
  );
}
