"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { ButtonLink } from "@/components/ui/button";
import { ProductImage } from "@/components/product/product-image";
import { formatInstallment, formatPrice } from "@/lib/utils";

/**
 * The opening shot.
 *
 * Direction: the device is the subject, lit from the upper left, so the
 * type holds the darker left third and the product owns the bright right.
 * Everything enters on one curve, one beat apart — eyebrow, headline, lead,
 * actions, then the product, which arrives last and takes a specular sweep
 * as it lands.
 *
 * The device is sized from the *viewport height*, not its width, so the
 * whole composition fits one frame on a laptop and on a 4K display alike.
 *
 * Mobile is not a narrowed desktop: the order changes so the product sits
 * directly under the headline instead of below a wall of text.
 */
export function Hero({ product }: { product: Product }) {
  const [offset, setOffset] = useState(0);
  const frame = useRef(0);

  // Parallax: the device drifts up at ~12% of scroll speed while the hero is
  // on screen. Read inside a rAF so the listener never touches layout.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        setOffset(Math.min(window.scrollY, window.innerHeight) * 0.12);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <section
      className="relative flex items-center overflow-hidden pt-24 pb-16 sm:pt-28 lg:min-h-[100svh] lg:pt-20 lg:pb-10"
      aria-labelledby="hero-title"
    >
      {/* Set: a single pool of warm light behind the subject. Nothing else
          — any rule or divider here would cross the product or the type. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_74%_42%,#ffffff_0%,rgba(255,255,255,0)_70%)]"
      />

      <div className="shell grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-10">
        {/* A — headline block */}
        <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1 lg:self-end">
          <p
            className="eyebrow ts-animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            {product.brand} · Nova geração
          </p>

          <h1
            id="hero-title"
            className="text-display ts-animate-fade-up"
            style={{ animationDelay: "220ms" }}
          >
            Tecnologia
            <br />
            em outro
            <br />
            <span className="text-accent">nível.</span>
          </h1>

          <p
            className="text-lead max-w-[38ch] text-ink-secondary ts-animate-fade-up"
            style={{ animationDelay: "360ms" }}
          >
            Smartphones selecionados para quem exige performance, design e
            inovação. Originais, com garantia real e atendimento que entende
            do assunto.
          </p>
        </div>

        {/* B — subject. Height-driven so it always fits the frame. */}
        <div className="relative flex flex-col items-center lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div
            className="relative ts-sheen ts-animate-fade"
            style={{
              animationDelay: "300ms",
              transform: `translate3d(0, ${-offset}px, 0)`,
              willChange: "transform",
            }}
          >
            <div
              className="aspect-[440/900] h-[min(46svh,20rem)] ts-animate-fade-up sm:h-[min(52svh,26rem)] lg:h-[min(72svh,40rem)]"
              style={{ animationDelay: "300ms", animationDuration: "1.4s" }}
            >
              <ProductImage
                product={product}
                priority
                sizes="(max-width: 1024px) 60vw, 24rem"
                label={`${product.name} — ${product.tagline}`}
              />
            </div>
          </div>

          {/* Price card: floated over the product on desktop, a plain row
              beneath it on phones where there is no room to overlap. */}
          <div
            className="mt-6 w-full max-w-[20rem] rounded-xl border border-line bg-elevated/85 p-5 shadow-medium backdrop-blur-xl ts-animate-fade-up lg:absolute lg:bottom-6 lg:left-0 lg:mt-0 lg:w-max lg:max-w-[18rem]"
            style={{ animationDelay: "820ms" }}
          >
            <p className="eyebrow">{product.name}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] tabular-nums">
              {formatPrice(product.price)}
            </p>
            <p className="mt-1 text-xs text-ink-muted tabular-nums">
              ou {formatInstallment(product.price, product.installments)}
            </p>
          </div>
        </div>

        {/* C — actions and headline specs. Below the product on phones. */}
        <div className="flex flex-col gap-7 lg:col-start-1 lg:row-start-2 lg:self-start">
          <div
            className="flex flex-col gap-3 ts-animate-fade-up sm:flex-row sm:flex-wrap sm:items-center"
            style={{ animationDelay: "480ms" }}
          >
            <ButtonLink href="/smartphones" size="lg">
              Explorar smartphones
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/ofertas" variant="secondary" size="lg">
              Ver ofertas
            </ButtonLink>
          </div>

          <dl
            className="flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-7 ts-animate-fade-up"
            style={{ animationDelay: "600ms" }}
          >
            {product.highlights.slice(0, 3).map((h) => (
              <div key={h.label}>
                <dt className="eyebrow">{h.label}</dt>
                <dd className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                  {h.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
