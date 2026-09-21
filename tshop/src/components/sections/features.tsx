import { BatteryCharging, Camera, Cpu, Monitor } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Cpu,
    eyebrow: "Performance",
    title: "Potência para tudo.",
    body: "Chips de última geração, prontos para jogos pesados, edição em 4K e IA local.",
    metric: "3,2×",
    metricLabel: "mais rápido que a geração anterior",
  },
  {
    icon: Camera,
    eyebrow: "Câmera",
    title: "Detalhes que parecem reais.",
    body: "Sensores grandes, óptica calibrada e processamento que respeita a cena.",
    metric: "200 MP",
    metricLabel: "no sensor principal do topo de linha",
  },
  {
    icon: BatteryCharging,
    eyebrow: "Bateria",
    title: "Mais tempo. Menos preocupação.",
    body: "Autonomia real para o dia inteiro e carregamento que resolve em minutos.",
    metric: "33 h",
    metricLabel: "de reprodução de vídeo",
  },
  {
    icon: Monitor,
    eyebrow: "Display",
    title: "Uma tela que desaparece.",
    body: "Bordas mínimas, 120 Hz e brilho que vence o sol do meio-dia.",
    metric: "3.000",
    metricLabel: "nits de pico em ambiente externo",
  },
];

export function Features() {
  return (
    <section
      className="shell py-20 sm:py-28 lg:py-36"
      aria-labelledby="features-title"
    >
      <SectionTitle
        eyebrow="Tecnologia"
        title={
          <span id="features-title">
            O que separa um bom aparelho de um excepcional.
          </span>
        }
        lead="Quatro coisas decidem a experiência do dia a dia. Nós escolhemos o catálogo por elas."
        className="max-w-2xl"
      />

      <ul className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:mt-20">
        {FEATURES.map((feature, i) => (
          <Reveal as="li" key={feature.eyebrow} delay={i * 90} className="flex">
            <article
              className={cn(
                "group flex w-full flex-col gap-6 rounded-xl border border-line bg-elevated p-7 sm:p-10",
                "transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "hover:-translate-y-1 hover:border-line-strong hover:shadow-medium",
                "motion-reduce:hover:translate-y-0",
              )}
            >
              <feature.icon
                className="size-5 text-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5"
                aria-hidden
                strokeWidth={1.5}
              />

              <div className="flex flex-col gap-3">
                <p className="eyebrow">{feature.eyebrow}</p>
                <h3 className="text-h3 max-w-[16ch]">{feature.title}</h3>
                <p className="max-w-[42ch] text-[0.9375rem] leading-relaxed text-ink-secondary">
                  {feature.body}
                </p>
              </div>

              <div className="mt-auto border-t border-line pt-6">
                <p className="text-4xl font-semibold tracking-[-0.045em] tabular-nums sm:text-5xl">
                  {feature.metric}
                </p>
                <p className="mt-1.5 text-xs text-ink-muted">
                  {feature.metricLabel}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
