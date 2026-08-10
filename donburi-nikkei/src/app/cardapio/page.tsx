"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SearchX, Star } from "lucide-react";
import { categorias, itens, itensPorCategoria } from "@/lib/data/menu";
import { restaurant } from "@/lib/data/restaurant";
import type { MenuItem, MenuTag } from "@/lib/types";
import { MenuToolbar } from "@/components/menu/menu-toolbar";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { ItemModal } from "@/components/menu/item-modal";

export default function CardapioPage() {
  const [query, setQuery] = useState("");
  const [tagsAtivas, setTagsAtivas] = useState<MenuTag[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0].id);
  const [itemSelecionado, setItemSelecionado] = useState<MenuItem | null>(null);

  const secoesRef = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollProgramatico = useRef(false);

  const buscaAtiva = query.trim().length > 0 || tagsAtivas.length > 0;

  const toggleTag = (tag: MenuTag) => {
    setTagsAtivas((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resultadosBusca = useMemo(() => {
    if (!buscaAtiva) return [];
    const q = query.trim().toLowerCase();
    return itens.filter((item) => {
      const matchQuery =
        !q ||
        item.nome.toLowerCase().includes(q) ||
        item.descricao.toLowerCase().includes(q);
      const matchTags =
        tagsAtivas.length === 0 || tagsAtivas.every((t) => item.tags?.includes(t));
      return matchQuery && matchTags;
    });
  }, [query, tagsAtivas, buscaAtiva]);

  const irParaCategoria = (id: string) => {
    setCategoriaAtiva(id);
    const el = secoesRef.current[id];
    if (el) {
      scrollProgramatico.current = true;
      const top = el.getBoundingClientRect().top + window.scrollY - 148;
      window.scrollTo({ top, behavior: "smooth" });
      window.setTimeout(() => {
        scrollProgramatico.current = false;
      }, 700);
    }
  };

  useEffect(() => {
    if (buscaAtiva) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollProgramatico.current) return;
        const visivel = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel?.target instanceof HTMLElement) {
          const id = visivel.target.dataset.categoriaId;
          if (id) setCategoriaAtiva(id);
        }
      },
      { rootMargin: "-160px 0px -55% 0px", threshold: 0 }
    );

    Object.values(secoesRef.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [buscaAtiva]);

  return (
    <>
      <section className="border-b border-ink/8 bg-rice-dim/60 px-5 pb-8 pt-10 md:px-8 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-vermillion">
            {restaurant.nomeCompleto}
          </span>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Cardápio digital
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              {restaurant.nota} ({restaurant.totalAvaliacoesLabel})
            </span>
            <span>Toque em um prato para ver detalhes e adicionar ao pedido.</span>
          </p>
        </div>
      </section>

      <MenuToolbar
        categorias={categorias}
        categoriaAtiva={categoriaAtiva}
        onCategoriaClick={irParaCategoria}
        query={query}
        onQueryChange={setQuery}
        tagsAtivas={tagsAtivas}
        onToggleTag={toggleTag}
        buscaAtiva={buscaAtiva}
      />

      <div className="mx-auto max-w-6xl px-5 pb-24 pt-6 md:px-8">
        <AnimatePresence mode="wait">
          {buscaAtiva ? (
            <motion.div
              key="resultados"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="mb-4 text-sm text-ink-soft">
                {resultadosBusca.length}{" "}
                {resultadosBusca.length === 1 ? "resultado" : "resultados"}
              </p>
              {resultadosBusca.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                  <SearchX className="h-10 w-10 text-ink/15" />
                  <p className="text-sm text-ink-soft">
                    Nenhum prato encontrado. Tente outra busca ou remova os filtros.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {resultadosBusca.map((item) => (
                    <MenuItemCard key={item.id} item={item} onOpen={setItemSelecionado} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="categorias"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-12"
            >
              {categorias.map((cat) => (
                <div
                  key={cat.id}
                  ref={(el) => {
                    secoesRef.current[cat.id] = el;
                  }}
                  data-categoria-id={cat.id}
                  className="scroll-mt-40"
                >
                  <div className="mb-4">
                    <h2 className="font-display text-xl text-ink sm:text-2xl">{cat.nome}</h2>
                    <p className="text-xs text-ink-soft">{cat.descricaoCurta}</p>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                    {itensPorCategoria(cat.id).map((item) => (
                      <MenuItemCard key={item.id} item={item} onOpen={setItemSelecionado} />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ItemModal item={itemSelecionado} onClose={() => setItemSelecionado(null)} />
    </>
  );
}
