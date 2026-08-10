"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { restaurant } from "@/lib/data/restaurant";

const links = [
  { href: "/#destaques", label: "Destaques" },
  { href: "/cardapio", label: "Cardápio" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#localizacao", label: "Localização" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const { totalItens, abrirCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-rice/95 shadow-[0_1px_0_0_rgba(28,23,18,0.08)] backdrop-blur-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-rice font-display text-sm">
            丼
          </span>
          <span className="font-display text-lg tracking-wide text-ink">
            {restaurant.nome}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-vermillion"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:+${restaurant.telefoneWhatsapp}`}
            className="hidden items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-vermillion md:flex"
          >
            <Phone className="h-4 w-4" />
            {restaurant.telefone}
          </a>

          <button
            onClick={abrirCart}
            aria-label="Abrir carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink transition-colors hover:border-vermillion hover:text-vermillion"
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            {totalItens > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-vermillion px-1 text-[11px] font-semibold text-rice">
                {totalItens}
              </span>
            )}
          </button>

          <button
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Abrir menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink md:hidden"
          >
            {menuAberto ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {menuAberto && (
        <nav className="flex flex-col gap-1 border-t border-ink/10 bg-rice px-5 py-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuAberto(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-ink/5 hover:text-vermillion"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`tel:+${restaurant.telefoneWhatsapp}`}
            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-ink/5 hover:text-vermillion"
          >
            <Phone className="h-4 w-4" />
            {restaurant.telefone}
          </a>
        </nav>
      )}
    </header>
  );
}
