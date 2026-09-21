/**
 * Production origin, used for canonical URLs, Open Graph, the sitemap and
 * JSON-LD. Set `NEXT_PUBLIC_SITE_URL` before deploying.
 *
 * Lives here rather than in the layout so that metadata routes
 * (`sitemap.ts`, `robots.ts`) can read it without importing the layout —
 * and with it the whole client tree and the fonts.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tshop.com.br";
