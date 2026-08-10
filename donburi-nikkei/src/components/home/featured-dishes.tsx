"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Flame } from "lucide-react";
import { destaques } from "@/lib/data/menu";
import { DishArt } from "@/components/icons/dish-illustrations";
import { formatCurrency } from "@/lib/utils";

export function FeaturedDishes() {
  return (
    <section id="sobre" className="relative bg-ink py-16 text-rice md:py-24">
      <div
        className="pointer-events-none absolute inset-0 text-rice/[0.04] pattern-seigaiha"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Assinatura da casa
            </span>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              Os pratos mais pedidos
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-rice/60">
              Cada prato nasce do encontro entre a técnica japonesa e o
              paladar brasileiro — feito na hora, todos os dias.
            </p>
          </div>
          <Link
            href="/cardapio"
            className="group hidden shrink-0 items-center gap-2 rounded-full border border-rice/20 px-5 py-3 text-sm font-semibold text-rice transition-colors hover:border-gold hover:text-gold md:inline-flex"
          >
            Cardápio completo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destaques.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group flex flex-col rounded-2xl border border-rice/10 bg-rice/5 p-5 transition-colors hover:border-gold/40 hover:bg-rice/[0.08]"
            >
              <div className="flex items-center justify-between">
                <div className="h-16 w-16 overflow-hidden rounded-full transition-transform group-hover:scale-105">
                  <DishArt type={item.illustration} />
                </div>
                <span className="flex items-center gap-1 rounded-full bg-vermillion/20 px-2.5 py-1 text-[11px] font-semibold text-vermillion-light">
                  <Flame className="h-3 w-3" />
                  Popular
                </span>
              </div>
              <h3 className="mt-4 font-display text-base leading-snug">{item.nome}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-rice/55">
                {item.descricao}
              </p>
              <p className="mt-4 font-display text-lg text-gold">
                {formatCurrency(item.preco)}
              </p>
            </motion.div>
          ))}
        </div>

        <Link
          href="/cardapio"
          className="mt-8 flex items-center justify-center gap-2 rounded-full border border-rice/20 px-5 py-3 text-sm font-semibold text-rice md:hidden"
        >
          Cardápio completo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
