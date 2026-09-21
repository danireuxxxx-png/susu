/**
 * Store profile — single source of truth for every piece of business
 * information rendered on the site (header, footer, contact, SEO, JSON-LD).
 *
 * ────────────────────────────────────────────────────────────────────────
 *  DATA PROVENANCE
 * ────────────────────────────────────────────────────────────────────────
 *  `verified: true`  → supplied directly by the store owner.
 *  `verified: false` → PLACEHOLDER. Not real. Must be replaced before the
 *                      site goes live.
 *
 *  The Instagram (@tshopdf) and Google Business profiles could not be read
 *  automatically: this build environment's egress policy blocks
 *  instagram.com and share.google, so no address, phone, hours, product
 *  list or photography could be extracted from them.
 *
 *  Nothing below is invented from those profiles. Anything not verified is
 *  an obvious, clearly-labelled stand-in — publishing an unverified address
 *  or CNPJ for a real business would be worse than publishing none.
 *
 *  TO GO LIVE: replace every `verified: false` value and flip the flag.
 * ────────────────────────────────────────────────────────────────────────
 */

export type Verifiable<T> = {
  value: T;
  verified: boolean;
  /** Where the value came from, or what is still needed. */
  note?: string;
};

const unverified = <T,>(value: T, note: string): Verifiable<T> => ({
  value,
  verified: false,
  note,
});

const verified = <T,>(value: T, note?: string): Verifiable<T> => ({
  value,
  verified: true,
  note,
});

export const store = {
  name: "TShop",
  legalName: unverified(
    "TShop Comércio de Eletrônicos",
    "Razão social real pendente — confirmar com o proprietário.",
  ),
  tagline: "Tecnologia em outro nível.",
  description:
    "Smartphones e acessórios originais, com garantia real e atendimento " +
    "especializado. Seleção curada para quem exige performance, design e " +
    "inovação.",

  /** Confirmed: handle supplied by the store owner. */
  instagram: verified(
    { handle: "tshopdf", url: "https://www.instagram.com/tshopdf" },
    "Handle informado pelo proprietário.",
  ),

  /** Confirmed: link supplied by the store owner (contents not readable here). */
  googleBusiness: verified(
    { url: "https://share.google/EMDy4UbAC5vpcHkjr" },
    "Link informado pelo proprietário; conteúdo não extraído (egress bloqueado).",
  ),

  address: unverified(
    {
      street: "Endereço a confirmar",
      district: "",
      city: "Brasília",
      state: "DF",
      postalCode: "",
      country: "BR",
      mapsUrl: "https://share.google/EMDy4UbAC5vpcHkjr",
    },
    "Extrair do perfil do Google Business. 'DF' no @tshopdf sugere Distrito Federal, mas não foi confirmado.",
  ),

  phone: unverified(
    { display: "(61) 0000-0000", e164: "+556100000000", whatsapp: "" },
    "Telefone e WhatsApp a confirmar com o proprietário.",
  ),

  email: unverified("contato@tshop.com.br", "E-mail a confirmar."),

  /** ISO weekday (1 = Mon) → opening hours. */
  hours: unverified(
    [
      { days: "Segunda a sexta", opens: "09:00", closes: "19:00" },
      { days: "Sábado", opens: "09:00", closes: "14:00" },
      { days: "Domingo", opens: null, closes: null },
    ],
    "Horários a extrair do Google Business.",
  ),

  cnpj: unverified("", "CNPJ a confirmar — obrigatório no rodapé para e-commerce."),

  /** Commercial claims shown in the trust section. Confirm each one. */
  guarantees: unverified(
    [
      "Produtos 100% originais e lacrados",
      "Garantia de 12 meses",
      "Entrega para todo o Brasil",
      "Atendimento especializado",
    ],
    "Confirmar prazos e cobertura reais antes de publicar.",
  ),
} as const;

/** Convenience readers — components use these, never the raw wrappers. */
export const storeAddressLine = () => {
  const a = store.address.value;
  return [a.street, a.district, `${a.city} — ${a.state}`]
    .filter(Boolean)
    .join(", ");
};

/**
 * Every unverified field, for the build-time warning surfaced in the footer
 * during development. Keeps placeholder data from silently shipping.
 */
export const unverifiedFields = (): { field: string; note: string }[] => {
  const isUnverified = (v: unknown): v is Verifiable<unknown> =>
    typeof v === "object" &&
    v !== null &&
    "verified" in v &&
    (v as Verifiable<unknown>).verified === false;

  return Object.entries(store)
    .filter(([, v]) => isUnverified(v))
    .map(([field, v]) => ({
      field,
      note: (v as Verifiable<unknown>).note ?? "",
    }));
};
