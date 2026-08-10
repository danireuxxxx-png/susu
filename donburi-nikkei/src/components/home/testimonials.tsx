"use client";

import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";
import { depoimentos, restaurant } from "@/lib/data/restaurant";

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-gold text-gold" />
          ))}
        </div>
        <h2 className="mt-4 font-display text-3xl text-ink sm:text-4xl">
          O que dizem sobre a casa
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Nota {restaurant.nota} com base em {restaurant.totalAvaliacoesLabel} avaliações
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {depoimentos.map((d, i) => (
          <motion.blockquote
            key={d.nome}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative rounded-2xl border border-ink/8 bg-paper p-6 shadow-sm"
          >
            <Quote className="h-6 w-6 text-gold/50" />
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{d.texto}</p>
            <footer className="mt-5 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{d.nome}</span>
              <span className="flex items-center gap-1 text-xs text-gold">
                {Array.from({ length: d.nota }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-gold text-gold" />
                ))}
              </span>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}
