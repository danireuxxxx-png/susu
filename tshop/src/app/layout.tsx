import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { CartProvider } from "@/hooks/use-cart";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Cursor } from "@/components/layout/cursor";
import { PageTransition } from "@/components/layout/page-transition";
import { store } from "@/lib/store";
import { SITE_URL } from "@/lib/site";
import { HydrationFlag } from "@/components/layout/hydration-flag";

/**
 * Entrance animations start at `opacity: 0` as an inline style, so a page
 * whose JavaScript never runs renders blank. This puts the content back —
 * an inline style can only be overridden with `!important`.
 */
const REVEAL_FALLBACK_CSS =
  '[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${store.name} — ${store.tagline}`,
    template: `%s · ${store.name}`,
  },
  description: store.description,
  applicationName: store.name,
  keywords: [
    "smartphones",
    "celulares",
    "iPhone",
    "Samsung Galaxy",
    "Xiaomi",
    "acessórios",
    "loja de celulares",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: store.name,
    title: `${store.name} — ${store.tagline}`,
    description: store.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${store.name} — ${store.tagline}`,
    description: store.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfdfc" },
    { media: "(prefers-color-scheme: dark)", color: "#fdfdfc" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // Never lock zoom: pinch-to-zoom is an accessibility affordance, not a
  // layout bug to suppress.
  maximumScale: 5,
};

/** Organisation-level structured data. Product schema lives on each PDP. */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: store.name,
  description: store.description,
  url: SITE_URL,
  sameAs: [store.instagram.value.url],
  address: {
    "@type": "PostalAddress",
    addressLocality: store.address.value.city,
    addressRegion: store.address.value.state,
    addressCountry: store.address.value.country,
    streetAddress: store.address.value.street,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="antialiased">
        {/*
          Entrance animations start at `opacity: 0` as an inline style, which
          means that without scripting the page renders blank. This puts the
          content back — an inline style can only be beaten by `!important`.
        */}
        <noscript>
          <style>{REVEAL_FALLBACK_CSS}</style>
        </noscript>

        {/*
          Same guarantee when scripting is *on* but the bundle never arrives —
          a blocked CDN, a failed chunk, a flaky connection. Without this the
          visitor gets a styled header above a blank page, which looks far
          more broken than a page with no animation. Hydration clears the
          flag long before the timer fires.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              `setTimeout(function(){if(document.documentElement.dataset.hydrated)return;` +
              `var s=document.createElement("style");s.textContent=${JSON.stringify(
                REVEAL_FALLBACK_CSS,
              )};document.head.appendChild(s)},2500)`,
          }}
        />

        <script
          type="application/ld+json"
          // Static, author-controlled object — no user input reaches it.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        <CartProvider>
          <HydrationFlag />
          <Cursor />
          <Header />
          <main id="conteudo">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
