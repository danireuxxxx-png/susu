"use client";

import { useState } from "react";
import type { Product, DeviceRender } from "@/lib/types";
import { ProductImage } from "./product-image";
import { cn } from "@/lib/utils";

type View = { id: string; label: string; face: "front" | "back" };

const VIEWS: View[] = [
  { id: "front", label: "Frente", face: "front" },
  { id: "back", label: "Traseira", face: "back" },
];

/**
 * Gallery with a zoom-on-pointer stage.
 *
 * With real photography in `photos`, the thumbnails index into that array.
 * Without it, they switch between the vector faces — the same interaction
 * either way, so nothing needs rewiring when the photos arrive.
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

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row lg:gap-6">
      {/* Thumbnails */}
      <ul
        className="flex gap-3 lg:flex-col"
        role="tablist"
        aria-label="Imagens do produto"
      >
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
                "transition-[border-color,transform] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                i === active
                  ? "border-ink"
                  : "border-line hover:border-line-strong",
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

      {/* Stage */}
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
              ? {
                  transform: "scale(1.5)",
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                }
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
              sizes="(max-width: 1024px) 90vw, 45vw"
              label={`${product.name}, ${views[active]?.label.toLowerCase()}`}
            />
          </div>
        </div>

        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink-faint lg:block">
          <span className="hidden lg:inline">Passe o mouse para ampliar</span>
        </p>
      </div>
    </div>
  );
}
