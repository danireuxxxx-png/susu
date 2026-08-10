"use client";

import { motion } from "motion/react";
import { MapPin, Clock, Phone, Navigation } from "lucide-react";
import { restaurant } from "@/lib/data/restaurant";

const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  restaurant.endereco
)}`;

const dias = [
  { dia: "Segunda a Quinta", horario: "11:30 – 22:00" },
  { dia: "Sexta e Sábado", horario: "11:30 – 22:30" },
  { dia: "Domingo", horario: "11:30 – 21:00" },
];

export function Location() {
  return (
    <section id="localizacao" className="bg-rice-dim py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2 md:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-vermillion">
            Visite a casa
          </span>
          <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
            Águas Claras, Brasília
          </h2>

          <ul className="mt-7 space-y-5">
            <li className="flex gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-vermillion shadow-sm">
                <MapPin className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Endereço</p>
                <p className="text-sm text-ink-soft">{restaurant.endereco}</p>
              </div>
            </li>
            <li className="flex gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-vermillion shadow-sm">
                <Clock className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Horário de funcionamento</p>
                <div className="mt-1 space-y-0.5">
                  {dias.map((d) => (
                    <p key={d.dia} className="text-sm text-ink-soft">
                      <span className="text-ink/70">{d.dia}:</span> {d.horario}
                    </p>
                  ))}
                </div>
              </div>
            </li>
            <li className="flex gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-vermillion shadow-sm">
                <Phone className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Telefone / WhatsApp</p>
                <p className="text-sm text-ink-soft">{restaurant.telefone}</p>
              </div>
            </li>
          </ul>

          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-rice transition-colors hover:bg-vermillion"
          >
            <Navigation className="h-4 w-4" />
            Traçar rota
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative min-h-[320px] overflow-hidden rounded-3xl border border-ink/10 bg-paper"
        >
          <div
            className="absolute inset-0 text-ink/10 pattern-dots"
            aria-hidden="true"
          />
          <svg
            viewBox="0 0 400 320"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <path
              d="M0 90 H400 M0 170 H400 M0 250 H400"
              stroke="currentColor"
              className="text-ink/10"
              strokeWidth="1.5"
            />
            <path
              d="M60 0 V320 M180 0 V320 M300 0 V320"
              stroke="currentColor"
              className="text-ink/10"
              strokeWidth="1.5"
            />
            <path
              d="M0 130 Q140 60 200 150 T400 190"
              stroke="currentColor"
              className="text-gold/50"
              strokeWidth="3"
              fill="none"
            />
          </svg>
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className="flex h-14 w-14 animate-pulse-ring items-center justify-center rounded-full bg-vermillion text-rice shadow-lg">
              <MapPin className="h-6 w-6" />
            </span>
            <span className="mt-3 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-rice shadow-md">
              Donburi · Águas Claras
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
