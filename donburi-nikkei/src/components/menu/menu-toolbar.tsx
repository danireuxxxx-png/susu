"use client";

import { Search, X } from "lucide-react";
import type { MenuCategory, MenuTag } from "@/lib/types";
import { cn } from "@/lib/utils";

const filtros: { tag: MenuTag; label: string }[] = [
  { tag: "vegetariano", label: "Vegetariano" },
  { tag: "picante", label: "Picante" },
  { tag: "mais-pedido", label: "Mais pedidos" },
];

export function MenuToolbar({
  categorias,
  categoriaAtiva,
  onCategoriaClick,
  query,
  onQueryChange,
  tagsAtivas,
  onToggleTag,
  buscaAtiva,
}: {
  categorias: MenuCategory[];
  categoriaAtiva: string;
  onCategoriaClick: (id: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  tagsAtivas: MenuTag[];
  onToggleTag: (tag: MenuTag) => void;
  buscaAtiva: boolean;
}) {
  return (
    <div className="sticky top-[65px] z-30 border-b border-ink/8 bg-rice/95 backdrop-blur-sm md:top-[73px]">
      <div className="mx-auto max-w-6xl px-5 py-3.5 md:px-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar no cardápio — ex: salmão, temaki, sobremesa…"
            className="w-full rounded-full border border-ink/12 bg-paper py-2.5 pl-10 pr-9 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-vermillion"
          />
          {query && (
            <button
              onClick={() => onQueryChange("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-vermillion"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtros.map((f) => (
            <button
              key={f.tag}
              onClick={() => onToggleTag(f.tag)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                tagsAtivas.includes(f.tag)
                  ? "border-vermillion bg-vermillion text-rice"
                  : "border-ink/12 text-ink-soft hover:border-vermillion hover:text-vermillion"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!buscaAtiva && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoriaClick(cat.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  categoriaAtiva === cat.id
                    ? "bg-ink text-rice"
                    : "bg-ink/5 text-ink-soft hover:bg-ink/10"
                )}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
