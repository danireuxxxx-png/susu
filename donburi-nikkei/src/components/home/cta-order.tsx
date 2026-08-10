"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Timer } from "lucide-react";

export function CtaOrder() {
  return (
    <section className="relative overflow-hidden bg-vermillion py-16 text-rice md:py-20">
      <div
        className="pointer-events-none absolute inset-0 text-rice/10 pattern-seigaiha"
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-5 text-center md:px-8"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-rice/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
          <Timer className="h-3.5 w-3.5" />
          Delivery em Águas Claras
        </span>
        <h2 className="font-display text-3xl leading-tight sm:text-4xl">
          Com fome? Seu donburi favorito está a um clique.
        </h2>
        <p className="max-w-lg text-sm text-rice/80 md:text-base">
          Monte seu pedido no cardápio interativo e finalize direto pelo
          WhatsApp — simples, rápido e sem complicação.
        </p>
        <Link
          href="/cardapio"
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-rice transition-transform hover:scale-105"
        >
          Fazer pedido agora
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </section>
  );
}
