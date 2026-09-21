"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useScrolledPast } from "@/hooks/use-media-query";
import { SearchOverlay } from "@/components/search/search-overlay";
import { Overlay } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";
import { store } from "@/lib/store";

const NAV = [
  { label: "Início", href: "/" },
  { label: "Smartphones", href: "/smartphones" },
  { label: "Apple", href: "/smartphones?marca=Apple" },
  { label: "Samsung", href: "/smartphones?marca=Samsung" },
  { label: "Acessórios", href: "/acessorios" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Sobre", href: "/sobre" },
];

export function Header() {
  const scrolled = useScrolledPast(24);
  const pathname = usePathname();
  const cart = useCart();

  /*
   * Overlays remember *which route* they were opened on, and are open only
   * while that route is still current. Navigating closes them as a matter of
   * derivation rather than an effect firing after the new page has painted.
   */
  const [searchRoute, setSearchRoute] = useState<string | null>(null);
  const [menuRoute, setMenuRoute] = useState<string | null>(null);
  const searchOpen = searchRoute === pathname;
  const menuOpen = menuRoute === pathname;
  const openSearch = useCallback(() => setSearchRoute(pathname), [pathname]);
  const closeSearch = useCallback(() => setSearchRoute(null), []);

  // Cmd/Ctrl+K opens search, the way every tool the audience already uses does.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  return (
    <>
      <a href="#conteudo" className="sr-only-focusable z-[100] m-4 rounded-full bg-ink px-5 py-3 text-sm text-on-ink">
        Pular para o conteúdo
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50",
          "transition-[height,background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          scrolled
            ? "h-14 border-b border-line bg-canvas/88 backdrop-blur-xl sm:h-16"
            : "h-16 border-b border-transparent bg-transparent sm:h-20",
        )}
      >
        <div className="shell flex h-full items-center justify-between gap-6">
          <Link
            href="/"
            className="shrink-0 text-[1.0625rem] font-semibold tracking-[-0.04em]"
            aria-label={`${store.name} — página inicial`}
          >
            {store.name}
            <span className="text-accent" aria-hidden>
              .
            </span>
          </Link>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href.split("?")[0]);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "link-underline text-[0.875rem] transition-colors duration-300",
                        active ? "text-ink" : "text-ink-secondary hover:text-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <IconButton
              label="Buscar produtos"
              onClick={openSearch}
            >
              <Search className="size-[1.15rem]" aria-hidden />
            </IconButton>

            <IconButton label="Minha conta" href="/conta" className="hidden sm:grid">
              <User className="size-[1.15rem]" aria-hidden />
            </IconButton>

            <IconButton
              label={`Sacola${cart.count > 0 ? ` (${cart.count} itens)` : ""}`}
              onClick={cart.open}
            >
              <ShoppingBag className="size-[1.15rem]" aria-hidden />
              {cart.count > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 grid min-w-[1.125rem] place-items-center rounded-full bg-accent px-1 text-[0.625rem] font-semibold leading-[1.125rem] text-white"
                >
                  {cart.count}
                </span>
              )}
            </IconButton>

            <IconButton
              label="Abrir menu"
              onClick={() => setMenuRoute(pathname)}
              className="lg:hidden"
            >
              <Menu className="size-[1.15rem]" aria-hidden />
            </IconButton>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={closeSearch} />

      <Overlay
        open={menuOpen}
        onClose={() => setMenuRoute(null)}
        title="Menu"
        variant="side"
      >
        <nav aria-label="Menu móvel" className="px-6 py-4">
          <ul className="flex flex-col">
            {NAV.map((item, i) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="block border-b border-line py-4 text-h3"
                  style={{
                    animation: `tsFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) ${
                      i * 45 + 80
                    }ms both`,
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <a
            href={store.instagram.value.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline mt-8 inline-block text-sm text-ink-secondary"
          >
            @{store.instagram.value.handle}
          </a>
        </nav>
      </Overlay>
    </>
  );
}

function IconButton({
  children,
  label,
  onClick,
  href,
  className,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const classes = cn(
    "relative grid size-10 place-items-center rounded-full text-ink",
    "transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "hover:bg-surface active:scale-95",
    className,
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={classes}>
      {children}
    </button>
  );
}
