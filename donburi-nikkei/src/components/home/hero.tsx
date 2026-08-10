"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Star, MapPin, Clock, ArrowRight } from "lucide-react";
import { restaurant } from "@/lib/data/restaurant";
import { DishArt } from "@/components/icons/dish-illustrations";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 text-ink/[0.05] pattern-seigaiha"
        aria-hidden="true"
      />
      <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-vermillion/10 blur-3xl" />
      <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-10 md:grid-cols-2 md:px-8 md:pb-24 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft/40 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-vermillion-dark">
            Restaurant Week · Águas Claras
          </span>

          <h1 className="mt-5 font-display text-4xl leading-[1.1] text-ink sm:text-5xl md:text-6xl">
            Cozinha nikkei que
            <span className="block text-vermillion">conta uma história.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft md:text-lg">
            Sushi, temakis e donburis autorais onde a tradição japonesa
            encontra o tempero latino. Peça online e receba em casa, ou
            reserve sua mesa em Águas Claras.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/cardapio"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-rice transition-all hover:bg-vermillion"
            >
              Ver cardápio e pedir
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#localizacao"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-vermillion hover:text-vermillion"
            >
              Ver localização
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-ink-soft">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="font-semibold text-ink">{restaurant.nota}</span>
              <span>({restaurant.totalAvaliacoesLabel})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-ink/40" />
              Aberto · fecha às {restaurant.horarioHoje.fecha}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-ink/40" />
              {restaurant.bairro}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative mx-auto aspect-square w-full max-w-md"
        >
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-vermillion via-vermillion-dark to-ink" />
          <div
            className="absolute inset-0 rounded-[2.5rem] text-rice/10 pattern-dots"
            aria-hidden="true"
          />
          <div className="absolute inset-6 rounded-[2rem] border border-rice/15" />

          <motion.div
            className="absolute left-8 top-10 h-24 w-24 animate-float-slow rounded-full bg-paper p-2 shadow-xl md:h-28 md:w-28"
            style={{ animationDelay: "0s" }}
          >
            <DishArt type="donburi" />
          </motion.div>
          <motion.div
            className="absolute right-6 top-1/3 h-20 w-20 animate-float-slow rounded-full bg-paper p-2 shadow-xl md:h-24 md:w-24"
            style={{ animationDelay: "1.2s" }}
          >
            <DishArt type="temaki" />
          </motion.div>
          <motion.div
            className="absolute bottom-10 left-1/4 h-24 w-24 animate-float-slow rounded-full bg-paper p-2 shadow-xl md:h-28 md:w-28"
            style={{ animationDelay: "2.4s" }}
          >
            <DishArt type="nigiri" />
          </motion.div>

          <div className="absolute bottom-6 right-6 flex items-center gap-2 rounded-2xl bg-paper/95 px-4 py-3 shadow-lg backdrop-blur">
            <span className="font-display text-2xl text-vermillion">丼</span>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-ink">Donburi</p>
              <p className="text-[11px] text-ink-soft">Cozinha Nikkei</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
