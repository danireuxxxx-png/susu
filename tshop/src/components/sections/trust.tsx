import { BadgeCheck, Headphones, ShieldCheck, Truck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";

const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Produtos originais",
    body: "Aparelhos lacrados, com nota fiscal e procedência verificável.",
  },
  {
    icon: ShieldCheck,
    title: "Garantia real",
    body: "Cobertura formal, com processo claro caso algo saia do previsto.",
  },
  {
    icon: Truck,
    title: "Entrega rastreada",
    body: "Envio protegido, acompanhado do pedido até a porta.",
  },
  {
    icon: Headphones,
    title: "Atendimento especializado",
    body: "Gente que usa os aparelhos e responde sem script.",
  },
];

export function Trust() {
  return (
    <section
      className="bg-ink-surface py-28 text-on-ink sm:py-36"
      aria-labelledby="trust-title"
    >
      <div className="shell">
        <div className="flex flex-col gap-6">
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-on-ink-secondary">
              <span aria-hidden className="inline-block h-px w-8 bg-accent" />
              Confiança
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 id="trust-title" className="text-h1 max-w-[16ch]">
              Seu próximo smartphone começa aqui.
            </h2>
          </Reveal>
        </div>

        <ul className="mt-16 grid gap-10 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar, i) => (
            <Reveal as="li" key={pillar.title} delay={i * 90}>
              <pillar.icon
                className="size-5 text-accent"
                strokeWidth={1.5}
                aria-hidden
              />
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em]">
                {pillar.title}
              </h3>
              <p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-on-ink-secondary">
                {pillar.body}
              </p>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={200}>
          <div className="mt-16 flex flex-wrap gap-3 border-t border-[color:var(--color-line-inverse)] pt-10">
            <ButtonLink
              href="/smartphones"
              size="lg"
              className="bg-elevated text-ink hover:bg-white"
            >
              Ver todo o catálogo
            </ButtonLink>
            <ButtonLink
              href="/sobre#contato"
              variant="ghost"
              size="lg"
              className="text-on-ink hover:bg-white/10"
            >
              Falar com a loja
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
