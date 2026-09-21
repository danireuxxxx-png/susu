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

/**
 * Set this to the production origin before launch — canonical URLs, Open
 * Graph images and the sitemap all resolve against it.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tshop.com.br";

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
        <script
          type="application/ld+json"
          // Static, author-controlled object — no user input reaches it.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        <CartProvider>
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
