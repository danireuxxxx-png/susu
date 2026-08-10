"use client";

import { motion } from "motion/react";
import { Sun, Leaf, PawPrint, Star } from "lucide-react";
import { restaurant } from "@/lib/data/restaurant";

const cards = [
  {
    icon: Sun,
    title: "Mesas externas",
    text: "Área ao ar livre para curtir o fim de tarde de Águas Claras.",
  },
  {
    icon: Leaf,
    title: "Opções vegetarianas",
    text: "Temakis, donburis e yakisoba pensados para todos os gostos.",
  },
  {
    icon: PawPrint,
    title: "Pet friendly",
    text: "Seu cão pode ficar com você na nossa área externa.",
  },
  {
    icon: Star,
    title: `${restaurant.nota} de avaliação`,
    text: `${restaurant.totalAvaliacoesLabel} avaliações de quem já provou.`,
  },
];

export function Highlights() {
  return (
    <section id="destaques" className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group rounded-2xl border border-ink/8 bg-paper p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md md:p-6"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-matcha-soft text-matcha transition-colors group-hover:bg-vermillion group-hover:text-rice">
              <card.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-base text-ink">{card.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{card.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
