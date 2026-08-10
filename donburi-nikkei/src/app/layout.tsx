import type { Metadata } from "next";
import { Inter, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsappFab } from "@/components/layout/whatsapp-fab";
import { CartDrawer } from "@/components/menu/cart-drawer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Donburi Cozinha Nikkei - Águas Claras",
  description:
    "Donburi Cozinha Nikkei em Águas Claras, Brasília. Cardápio digital, pedidos e delivery de cozinha nikkei — sushi, temakis, donburis e muito mais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${notoSerifJp.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-rice text-ink">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsappFab />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
