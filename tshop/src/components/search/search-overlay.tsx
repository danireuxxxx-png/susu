"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { ProductImage } from "@/components/product/product-image";
import { searchProducts } from "@/lib/products";
import { formatPrice } from "@/lib/utils";

const SUGGESTIONS = ["iPhone", "Samsung", "Xiaomi", "Acessórios", "Ofertas"];

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Results are computed synchronously — the catalogue is small enough that
  // debouncing would only add perceived latency.
  const results = useMemo(() => searchProducts(query).slice(0, 6), [query]);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
    // Clear on close so the next open starts fresh.
    const timer = setTimeout(() => setQuery(""), 400);
    return () => clearTimeout(timer);
  }, [open]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (results[0]) {
      router.push(`/produto/${results[0].slug}`);
      onClose();
    }
  };

  return (
    <Overlay
      open={open}
      onClose={onClose}
      variant="sheet"
      title="Buscar produtos"
      hideTitle
      className="max-h-[85dvh]"
    >
      <div className="shell py-8 sm:py-12">
        <form onSubmit={submit} role="search">
          <label htmlFor="site-search" className="eyebrow mb-4 block">
            Buscar
          </label>
          <div className="flex items-center gap-4 border-b border-line-strong pb-4">
            <Search className="size-5 shrink-0 text-ink-muted" aria-hidden />
            <input
              ref={inputRef}
              id="site-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="iPhone, Galaxy, carregador…"
              autoComplete="off"
              className="w-full bg-transparent text-h3 outline-none placeholder:text-ink-faint"
            />
          </div>
        </form>

        <div className="mt-8" aria-live="polite">
          {query.trim() === "" ? (
            <div className="flex flex-col gap-4">
              <p className="eyebrow">Sugestões</p>
              <ul className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => setQuery(s)}
                      className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-line-strong hover:bg-surface"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <SearchX className="size-6 text-ink-faint" aria-hidden />
              <p className="text-h3">Nada encontrado para “{query}”</p>
              <p className="max-w-[40ch] text-sm text-ink-secondary">
                Tente uma marca, um modelo, ou fale com a gente — podemos
                encomendar o aparelho que você procura.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {results.map((product, i) => (
                <li key={product.slug}>
                  <Link
                    href={`/produto/${product.slug}`}
                    onClick={onClose}
                    className="group flex items-center gap-4 border-b border-line py-4 transition-[padding] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:pl-2"
                    style={{
                      animation: `tsFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 55}ms both`,
                    }}
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-surface p-1.5">
                      <ProductImage
                        product={product}
                        shadow={false}
                        sizes="56px"
                        label=""
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="truncate text-sm text-ink-muted">
                        {product.brand} · {product.tagline}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatPrice(product.price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Overlay>
  );
}
