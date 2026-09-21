"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, PackageOpen } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductGrid } from "./product-grid";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

type Sort = "relevancia" | "menor-preco" | "maior-preco" | "desconto";

const SORTS: { value: Sort; label: string }[] = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "desconto", label: "Maior desconto" },
];

export function CatalogBrowser({
  products,
  brands,
}: {
  products: Product[];
  brands: string[];
}) {
  /*
   * The brand can arrive in the URL (`/smartphones?marca=Apple`, from the
   * header). It is *derived* from the query string until the visitor touches
   * a chip, at which point their choice takes over — no effect, so there is
   * no render where the wrong set is on screen.
   */
  const params = useSearchParams();
  const fromUrl = params.get("marca");
  const urlBrand = fromUrl && brands.includes(fromUrl) ? fromUrl : null;
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const brand = chosen === undefined ? urlBrand : chosen;
  const setBrand = setChosen;

  const [sort, setSort] = useState<Sort>("relevancia");
  const [inStockOnly, setInStockOnly] = useState(false);

  const visible = useMemo(() => {
    let list = products;
    if (brand) list = list.filter((p) => p.brand === brand);
    if (inStockOnly) list = list.filter((p) => p.stock > 0);

    const discount = (p: Product) =>
      p.compareAtPrice ? 1 - p.price / p.compareAtPrice : 0;

    return [...list].sort((a, b) => {
      switch (sort) {
        case "menor-preco":
          return a.price - b.price;
        case "maior-preco":
          return b.price - a.price;
        case "desconto":
          return discount(b) - discount(a);
        default:
          return (b.featured ?? 0) - (a.featured ?? 0);
      }
    });
  }, [products, brand, sort, inStockOnly]);

  const prices = visible.map((p) => p.price);
  const from = prices.length ? Math.min(...prices) : 0;

  return (
    <>
      {/*
        The full-bleed negative margin has to track `.shell`'s own gutter
        exactly, and `.shell` switches at 768px and 1280px — `md` and `xl`,
        not `sm` and `lg`. Using the wrong pair pushes this bar 24px past the
        viewport between those breakpoints.
      */}
      <div className="sticky top-14 z-30 -mx-6 border-y border-line bg-canvas/85 px-6 py-4 backdrop-blur-xl sm:top-16 md:-mx-10 md:px-10 xl:-mx-16 xl:px-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Brand filter */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
            <SlidersHorizontal
              className="size-4 shrink-0 text-ink-muted"
              aria-hidden
            />
            <div
              role="group"
              aria-label="Filtrar por marca"
              className="flex gap-2"
            >
              <Chip active={brand === null} onClick={() => setBrand(null)}>
                Todas
              </Chip>
              {brands.map((b) => (
                <Chip
                  key={b}
                  active={brand === b}
                  onClick={() => setBrand(brand === b ? null : b)}
                >
                  {b}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 text-sm text-ink-secondary sm:min-h-0">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="size-5 rounded-sm border-line-strong accent-[color:var(--color-ink)] sm:size-4"
              />
              Só disponíveis
            </label>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="sr-only">
                Ordenar por
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-11 cursor-pointer rounded-full border border-line bg-elevated px-4 text-sm outline-none transition-colors hover:border-line-strong sm:h-10"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-ink-muted" aria-live="polite">
        {visible.length}{" "}
        {visible.length === 1 ? "aparelho" : "aparelhos"}
        {visible.length > 0 && <> · a partir de {formatPrice(from)}</>}
      </p>

      <ProductGrid
        products={visible}
        columns={3}
        className="mt-8"
        emptyState={
          <EmptyState
            onReset={() => {
              setBrand(null);
              setInStockOnly(false);
            }}
          />
        }
      />
    </>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm sm:h-10",
        "transition-[background-color,border-color,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        active
          ? "border-ink bg-ink text-on-ink"
          : "border-line bg-elevated text-ink-secondary hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-line py-20 text-center">
      <PackageOpen className="size-6 text-ink-faint" aria-hidden />
      <div className="flex flex-col gap-2">
        <p className="text-h3">Nenhum aparelho com esses filtros</p>
        <p className="max-w-[42ch] text-sm text-ink-secondary">
          Ajuste a marca ou a disponibilidade — ou fale com a loja, podemos
          encomendar.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={onReset}>
          Limpar filtros
        </Button>
        <ButtonLink href="/sobre#contato" variant="ghost">
          Falar com a loja
        </ButtonLink>
      </div>
    </div>
  );
}
