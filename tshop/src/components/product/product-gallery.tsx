"use client";

import { useCallback, useRef, useState } from "react";
import type { Product, DeviceRender } from "@/lib/types";
import { ProductImage } from "./product-image";
import { cn } from "@/lib/utils";

type View = { id: string; label: string; face: "front" | "back" };

const VIEWS: View[] = [
  { id: "front", label: "Frente", face: "front" },
  { id: "back", label: "Traseira", face: "back" },
];

/**
 * Two galleries, one per input model.
 *
 * On a phone the views are a snapping carousel you swipe — pointer zoom is
 * meaningless without a pointer, and a column of thumbnails wastes the width
 * the product should be using. On a pointer device the stage magnifies under
 * the cursor and the thumbnails return as a rail beside it.
 *
 * With real photography in `photos`, both forms index into that array
 * instead of the vector faces — no rewiring needed when the photos arrive.
 */
export function ProductGallery({
  product,
  colorOverride,
}: {
  product: Product;
  colorOverride?: Partial<DeviceRender>;
}) {
  const hasPhotos = product.photos.length > 0;
  const views: View[] = hasPhotos
    ? product.photos.map((_, i) => ({
        id: String(i),
        label: `Imagem ${i + 1}`,
        face: "front" as const,
      }))
    : VIEWS;

  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    // Touch "hover" would leave the stage stuck mid-zoom after a tap.
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const onTrackScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const pitch = (track.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
    if (pitch > 0) setActive(Math.round(track.scrollLeft / pitch));
  }, []);

  const swipeTo = (index: number) => {
    const item = trackRef.current?.children[index] as HTMLElement | undefined;
    item?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  return (
    <>
      {/* ── Phones: swipeable stage ─────────────────────────────────────── */}
      <div className="lg:hidden">
        <ul
          ref={trackRef}
          onScroll={onTrackScroll}
          aria-label="Imagens do produto"
          className={cn(
            "-mx-6 flex snap-x snap-mandatory overflow-x-auto scroll-px-6 px-6",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain",
          )}
        >
          {views.map((view, i) => (
            <li key={view.id} className="w-full shrink-0 snap-start">
              <div className="relative overflow-hidden rounded-2xl bg-surface">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_36%,#ffffff_0%,transparent_70%)]"
                />
                <div className="relative flex aspect-square items-center justify-center p-[12%]">
                  <div className="aspect-[440/900] h-full">
                    <ProductImage
                      product={product}
                      index={hasPhotos ? i : 0}
                      face={view.face}
                      overrides={colorOverride}
                      priority={i === 0}
                      sizes="90vw"
                      label={`${product.name}, ${view.label.toLowerCase()}`}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {views.length > 1 && (
          <div className="mt-4 flex justify-center gap-1.5">
            {views.map((view, i) => (
              <button
                key={view.id}
                type="button"
                aria-label={`Ver ${view.label.toLowerCase()}`}
                aria-current={i === active}
                onClick={() => swipeTo(i)}
                className="grid size-11 place-items-center"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    i === active ? "w-5 bg-ink" : "w-1.5 bg-line-strong",
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Pointer devices: thumbnails + magnifying stage ──────────────── */}
      <div className="hidden lg:flex lg:gap-6">
        <ul role="tablist" aria-label="Imagens do produto" className="flex flex-col gap-3">
          {views.map((view, i) => (
            <li key={view.id}>
              <button
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={view.label}
                onClick={() => setActive(i)}
                className={cn(
                  "relative aspect-square w-16 overflow-hidden rounded-lg border bg-surface p-2",
                  "transition-[border-color] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  i === active ? "border-ink" : "border-line hover:border-line-strong",
                )}
              >
                <ProductImage
                  product={product}
                  index={hasPhotos ? i : 0}
                  face={view.face}
                  overrides={colorOverride}
                  shadow={false}
                  sizes="64px"
                  label=""
                />
              </button>
            </li>
          ))}
        </ul>

        <div
          className="relative flex-1 overflow-hidden rounded-2xl bg-surface"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setZoom(null)}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_36%,#ffffff_0%,transparent_70%)]"
          />
          <div
            className="relative flex aspect-square items-center justify-center p-[12%] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transform-none"
            style={
              zoom
                ? { transform: "scale(1.5)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                : undefined
            }
          >
            <div className="aspect-[440/900] h-full">
              <ProductImage
                product={product}
                index={hasPhotos ? active : 0}
                face={views[active]?.face ?? "front"}
                overrides={colorOverride}
                priority
                sizes="45vw"
                label={`${product.name}, ${views[active]?.label.toLowerCase()}`}
              />
            </div>
          </div>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink-faint">
            Passe o mouse para ampliar
          </p>
        </div>
      </div>
    </>
  );
}
