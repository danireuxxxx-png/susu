import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";
import { ButtonLink } from "@/components/ui/button";
import { store, storeAddressLine } from "@/lib/store";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Quem somos, onde estamos e como funcionam garantia, entrega e trocas.",
  alternates: { canonical: "/sobre" },
};

const POLICIES = [
  {
    id: "entrega",
    title: "Entrega",
    body:
      "Envio rastreado para todo o Brasil, com embalagem reforçada. Frete " +
      "grátis a partir de R$ 2.000. Retirada na loja disponível mediante " +
      "combinação prévia.",
  },
  {
    id: "garantia",
    title: "Garantia",
    body:
      "Todos os aparelhos saem lacrados, com nota fiscal e garantia formal. " +
      "Em caso de defeito, a loja intermedeia o atendimento em vez de " +
      "encaminhar você para um protocolo.",
  },
  {
    id: "trocas",
    title: "Trocas e devoluções",
    body:
      "Arrependimento em até 7 dias corridos após o recebimento, conforme o " +
      "Código de Defesa do Consumidor, com o produto sem sinais de uso e na " +
      "embalagem original.",
  },
];

export default function SobrePage() {
  const hours = store.hours.value;
  const phone = store.phone.value;

  return (
    <div className="shell pt-32 sm:pt-40">
      <header className="flex max-w-3xl flex-col gap-5 pb-20">
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden className="inline-block h-px w-8 bg-accent" />
            Sobre
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="text-h1 max-w-[18ch]">
            Uma loja pequena, por escolha.
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="text-lead text-ink-secondary">
            {store.description} Trabalhamos com um catálogo curto porque
            preferimos conhecer bem cada aparelho que vendemos a listar
            centenas que nunca tivemos em mãos.
          </p>
        </Reveal>
      </header>

      {/* Store ------------------------------------------------------------- */}
      <section id="loja" className="scroll-mt-28 border-t border-line py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <SectionTitle eyebrow="Nossa loja" title="Onde nos encontrar." />

          <Reveal delay={120}>
            <dl className="flex flex-col divide-y divide-[color:var(--color-line)]">
              <Detail icon={MapPin} label="Endereço">
                <a
                  href={store.googleBusiness.value.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline inline-flex min-h-11 items-center sm:min-h-0"
                >
                  {storeAddressLine()}
                </a>
                {!store.address.verified && (
                  <span className="mt-1 block text-xs text-ink-faint">
                    Endereço completo em confirmação.
                  </span>
                )}
              </Detail>

              <Detail icon={Clock} label="Horário">
                <ul className="flex flex-col gap-1">
                  {hours.map((h) => (
                    <li key={h.days} className="tabular-nums">
                      {h.days} —{" "}
                      {h.opens && h.closes
                        ? `${h.opens} às ${h.closes}`
                        : "fechado"}
                    </li>
                  ))}
                </ul>
              </Detail>

              <Detail icon={Phone} label="Telefone">
                <a href={`tel:${phone.e164}`} className="link-underline inline-flex min-h-11 items-center sm:min-h-0">
                  {phone.display}
                </a>
              </Detail>

              <Detail icon={Mail} label="E-mail">
                <a
                  href={`mailto:${store.email.value}`}
                  className="link-underline inline-flex min-h-11 items-center sm:min-h-0"
                >
                  {store.email.value}
                </a>
              </Detail>

              <Detail icon={InstagramIcon} label="Instagram">
                <a
                  href={store.instagram.value.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline inline-flex min-h-11 items-center sm:min-h-0"
                >
                  @{store.instagram.value.handle}
                </a>
              </Detail>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Policies ---------------------------------------------------------- */}
      <section className="border-t border-line py-20" aria-labelledby="policies">
        <SectionTitle
          eyebrow="Como funciona"
          title={<span id="policies">Sem letra miúda.</span>}
          className="max-w-xl"
        />

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {POLICIES.map((policy, i) => (
            <Reveal key={policy.id} delay={i * 90}>
              <article id={policy.id} className="scroll-mt-28">
                <h3 className="text-h3">{policy.title}</h3>
                <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-ink-secondary">
                  {policy.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Contact ----------------------------------------------------------- */}
      <section
        id="contato"
        className="scroll-mt-28 border-t border-line py-20"
        aria-labelledby="contact-title"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            eyebrow="Contato"
            title={<span id="contact-title">Fale com a gente.</span>}
            lead="Dúvida sobre configuração, prazo ou disponibilidade? Chame no Instagram ou ligue — responde gente, não robô."
            className="max-w-xl"
          />

          <Reveal delay={160}>
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href={store.instagram.value.url}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
              >
                <InstagramIcon className="size-4" />
                @{store.instagram.value.handle}
              </ButtonLink>
              <ButtonLink
                href={`tel:${phone.e164}`}
                variant="secondary"
                size="lg"
              >
                {phone.display}
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-5 py-5">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-accent"
        strokeWidth={1.5}
        aria-hidden
      />
      <div className="flex-1">
        <dt className="eyebrow">{label}</dt>
        <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-secondary">
          {children}
        </dd>
      </div>
    </div>
  );
}
