import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Élan — Estética Avançada",
  description: "Dashboard inteligente para clínicas de estética avançada.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang="pt-BR"
      data-theme={theme}
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
