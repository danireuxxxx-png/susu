import Link from "next/link";
import { MapPin, Phone, Clock } from "lucide-react";
import { restaurant } from "@/lib/data/restaurant";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-rice">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rice text-ink font-display text-sm">
              丼
            </span>
            <span className="font-display text-lg tracking-wide">{restaurant.nome}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-rice/60">
            Cozinha nikkei autoral em Águas Claras — o encontro da tradição
            japonesa com o tempero peruano-brasileiro.
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex items-center gap-2 text-sm text-rice/70 transition-colors hover:text-gold"
          >
            <InstagramIcon className="h-4 w-4" />
            @donburinikkei
          </a>
        </div>

        <div>
          <h3 className="font-display text-sm uppercase tracking-[0.2em] text-gold">
            Contato
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-rice/75">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rice/50" />
              {restaurant.endereco}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-rice/50" />
              {restaurant.telefone}
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-rice/50" />
              Todos os dias · até {restaurant.horarioHoje.fecha}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm uppercase tracking-[0.2em] text-gold">
            Navegação
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-rice/75">
            <li>
              <Link href="/cardapio" className="transition-colors hover:text-gold">
                Cardápio digital
              </Link>
            </li>
            <li>
              <Link href="/#sobre" className="transition-colors hover:text-gold">
                Sobre a casa
              </Link>
            </li>
            <li>
              <Link href="/#localizacao" className="transition-colors hover:text-gold">
                Localização
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rice/10 px-5 py-5 text-center text-xs text-rice/40 md:px-8">
        © {new Date().getFullYear()} {restaurant.nomeCompleto}. Protótipo de site e cardápio digital.
      </div>
    </footer>
  );
}
