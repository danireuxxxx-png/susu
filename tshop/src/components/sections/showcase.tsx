"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/product/product-image";
import { ButtonLink } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { Rail } from "@/components/ui/rail";
import { cn } from "@/lib/utils";

/** The beats the device moves through as the section scrolls past. */
const CHAPTERS = [
  {
    eyebrow: "O produto",
    title: "Cada detalhe, deliberado.",
    body:
      "Titânio escovado nas laterais, vidro cerâmico na frente, e uma " +
      "tolerância de montagem que você percebe antes mesmo de ligar o " +
      "aparelho.",
  },
  {
    eyebrow: "Desempenho",
    title: "Potência para tudo.",
    body:
      "Arquitetura de última geração com GPU dedicada a ray tracing. Jogos, " +
      "edição em 4K e modelos de IA rodando no próprio aparelho.",
  },
  {
    eyebrow: "Câmera",
    title: "Detalhes que parecem reais.",
    body:
      "Sensor principal de alta resolução, teleobjetiva com alcance " +
      "estendido e processamento computacional que preserva a textura da " +
      "pele em vez de apagá-la.",
  },
];

/**
 * The scroll-driven centrepiece: the device is pinned while three chapters
 * pass beside it, rotating and settling as the visitor reads.
 *
 * Progress comes from one IntersectionObserver-gated scroll listener,
 * throttled to a frame, writing only `transform` — the device never causes
 * layout or paint work beyond its own compositing layer.
 */
export function Showcase({ product }: { product: Product }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const node = sectionRef.current;
    if (!node) return;

    let frame = 0;
    let observing = false;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(Math.max(-rect.top / scrollable, 0), 1));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    // Only listen while the section is anywhere near the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !observing) {
          observing = true;
          window.addEventListener("scroll", onScroll, { passive: true });
          measure();
        } else if (!entry.isIntersecting && observing) {
          observing = false;
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "20% 0px" },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  const active = Math.min(
    Math.floor(progress * CHAPTERS.length),
    CHAPTERS.length - 1,
  );

  // The device turns through ~26°, drifts, and breathes in scale — a single
  // slow move rather than three separate ones.
  const rotate = -14 + progress * 28;
  const scale = 0.92 + Math.sin(progress * Math.PI) * 0.12;
  const drift = (progress - 0.5) * 60;

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative bg-surface",
        /* The pinned, scroll-driven version is a desktop idea: it spends
           three viewports of scroll to turn one object. On a phone that is
           2.500px of thumb work, so the section keeps its natural height and
           the chapters become a rail the visitor swipes instead. */
        !reduced && "lg:min-h-[300vh]",
      )}
      aria-labelledby="showcase-title"
    >
      <div
        className={cn(
          "flex items-center lg:min-h-[100svh]",
          !reduced && "lg:sticky lg:top-0",
        )}
      >
        <div className="shell grid w-full items-center gap-8 py-16 sm:gap-12 sm:py-20 lg:grid-cols-2 lg:gap-16">
          {/* Chapters */}
          <div className="relative order-2 min-w-0 lg:order-1 lg:min-h-[22rem]">
            {/* Phones: swipe through the chapters. */}
            <Rail
              label="Capítulos do produto"
              className="lg:hidden"
              gridClassName=""
              itemClassName="flex-col gap-5"
            >
              {CHAPTERS.map((chapter, i) => (
                <div key={chapter.title} className="flex flex-col gap-4">
                  <p className="eyebrow flex items-center gap-3">
                    <span aria-hidden className="inline-block h-px w-8 bg-accent" />
                    {chapter.eyebrow}
                  </p>
                  <h2
                    id={i === 0 ? "showcase-title-mobile" : undefined}
                    className="text-h2"
                  >
                    {chapter.title}
                  </h2>
                  <p className="text-ink-secondary">{chapter.body}</p>
                </div>
              ))}
            </Rail>

            {/* Desktop: one chapter at a time, tied to scroll progress. */}
            {CHAPTERS.map((chapter, i) => {
              const isActive = reduced || i === active;
              return (
                <div
                  key={chapter.title}
                  aria-hidden={!isActive}
                  className={cn(
                    "hidden flex-col gap-5 lg:flex",
                    reduced
                      ? "lg:relative lg:mb-16"
                      : [
                          "lg:absolute lg:inset-x-0 lg:top-0",
                          "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          isActive
                            ? "opacity-100 lg:translate-y-0"
                            : "opacity-0 lg:pointer-events-none lg:translate-y-6",
                        ],
                  )}
                >
                  <p className="eyebrow flex items-center gap-3">
                    <span aria-hidden className="inline-block h-px w-8 bg-accent" />
                    {chapter.eyebrow}
                  </p>
                  <h2
                    id={i === 0 ? "showcase-title" : undefined}
                    className="text-h1 max-w-[14ch]"
                  >
                    {chapter.title}
                  </h2>
                  <p className="text-lead max-w-[44ch] text-ink-secondary">
                    {chapter.body}
                  </p>
                </div>
              );
            })}

            {!reduced && (
              <div className="mt-8 hidden gap-2 lg:absolute lg:bottom-0 lg:flex">
                {CHAPTERS.map((c, i) => (
                  <span
                    key={c.title}
                    aria-hidden
                    className={cn(
                      "h-[2px] w-10 rounded-full transition-colors duration-500",
                      i === active ? "bg-ink" : "bg-line-strong",
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="order-1 flex justify-center lg:order-2">
            <div
              className="aspect-[440/900] w-full max-w-[min(46vw,10.5rem)] max-lg:!transform-none sm:max-w-[15rem] lg:max-w-[clamp(14rem,34vw,22rem)]"
              style={
                reduced
                  ? undefined
                  : {
                      transform: `translate3d(0, ${drift}px, 0) rotate(${rotate}deg) scale(${scale})`,
                      willChange: "transform",
                    }
              }
            >
              <ProductImage
                product={product}
                face={progress > 0.62 ? "back" : "front"}
                sizes="(max-width: 1024px) 60vw, 22rem"
                label={`${product.name} visto de todos os ângulos`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Closing beat, after the pin releases. */}
      <div className="shell relative flex justify-center pb-16 sm:pb-20">
        <ButtonLink href={`/produto/${product.slug}`} variant="secondary" size="lg">
          Conhecer o {product.name}
        </ButtonLink>
      </div>
    </section>
  );
}
