import Link from "next/link";
import { MapPin } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import { store, storeAddressLine, unverifiedFields } from "@/lib/store";
import { Newsletter } from "@/components/sections/newsletter";

const COLUMNS = [
  {
    title: "Produtos",
    links: [
      { label: "Smartphones", href: "/smartphones" },
      { label: "Apple", href: "/smartphones?marca=Apple" },
      { label: "Samsung", href: "/smartphones?marca=Samsung" },
      { label: "Acessórios", href: "/acessorios" },
      { label: "Ofertas", href: "/ofertas" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre a TShop", href: "/sobre" },
      { label: "Nossa loja", href: "/sobre#loja" },
      { label: "Trabalhe conosco", href: "/sobre#contato" },
    ],
  },
  {
    title: "Atendimento",
    links: [
      { label: "Fale conosco", href: "/sobre#contato" },
      { label: "Prazos de entrega", href: "/sobre#entrega" },
      { label: "Trocas e devoluções", href: "/sobre#trocas" },
      { label: "Garantia", href: "/sobre#garantia" },
    ],
  },
];

export function Footer() {
  const pending = unverifiedFields();

  return (
    <footer className="mt-20 border-t border-line bg-elevated sm:mt-28 lg:mt-32">
      <Newsletter />

      <div className="shell grid gap-12 border-t border-line py-16 lg:grid-cols-[1.2fr_2fr] lg:gap-20">
        <div className="flex flex-col gap-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-2xl font-semibold tracking-[-0.045em] sm:min-h-0"
          >
            {store.name}
            <span className="text-accent" aria-hidden>
              .
            </span>
          </Link>

          <p className="max-w-[34ch] text-sm leading-relaxed text-ink-secondary">
            {store.description}
          </p>

          <div className="flex flex-col gap-3 text-sm">
            <a
              href={store.googleBusiness.value.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-11 items-start gap-2.5 py-1 text-ink-secondary transition-colors hover:text-ink sm:min-h-0 sm:py-0"
            >
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="link-underline">{storeAddressLine()}</span>
            </a>

            <a
              href={store.instagram.value.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2.5 text-ink-secondary transition-colors hover:text-ink sm:min-h-0"
            >
              <InstagramIcon className="size-4 shrink-0" />
              <span className="link-underline">
                @{store.instagram.value.handle}
              </span>
            </a>
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="eyebrow mb-5">{column.title}</h2>
              <ul className="flex flex-col gap-1 sm:gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="link-underline inline-flex min-h-11 items-center text-sm text-ink-secondary transition-colors hover:text-ink sm:min-h-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="shell flex flex-col gap-5 border-t border-line py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">
          © {new Date().getFullYear()} {store.name}.
          {store.cnpj.value ? ` CNPJ ${store.cnpj.value}.` : ""} Todos os
          direitos reservados.
        </p>

        {/*
          Políticas formais (privacidade, termos) ainda não foram redigidas —
          exigem o texto real da loja. Até lá estes links apontam para as
          seções equivalentes em /sobre, que existem, em vez de rotas
          inexistentes.
        */}
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
          <li>
            <Link href="/sobre#trocas" className="link-underline inline-flex min-h-11 items-center sm:min-h-0">
              Trocas e devoluções
            </Link>
          </li>
          <li>
            <Link href="/sobre#garantia" className="link-underline inline-flex min-h-11 items-center sm:min-h-0">
              Garantia
            </Link>
          </li>
          <li>
            <Link href="/sobre#entrega" className="link-underline inline-flex min-h-11 items-center sm:min-h-0">
              Entrega
            </Link>
          </li>
        </ul>
      </div>

      {/*
        Development-only guard rail. Placeholder business data is the single
        most likely thing to ship by accident here, so it announces itself
        loudly in dev and disappears entirely from the production bundle.
      */}
      {process.env.NODE_ENV === "development" && pending.length > 0 && (
        <div className="shell pb-10">
          <details className="rounded-lg border border-dashed border-warning/40 bg-warning/5 p-4 text-xs">
            <summary className="cursor-pointer font-semibold text-warning">
              {pending.length} campo(s) do perfil da loja ainda são
              placeholders — não publique assim
            </summary>
            <ul className="mt-3 flex flex-col gap-2 text-ink-secondary">
              {pending.map((f) => (
                <li key={f.field}>
                  <code className="font-mono text-ink">{f.field}</code> —{" "}
                  {f.note}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </footer>
  );
}
