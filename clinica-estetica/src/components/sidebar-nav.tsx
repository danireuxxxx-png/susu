"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/overview", icon: "◈", label: "Visão geral" },
  { href: "/ranking", icon: "♛", label: "Profissionais" },
  { href: "/pacientes", icon: "❖", label: "Pacientes" },
  { href: "/consulta", icon: "◉", label: "Consulta IA" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          pathname.startsWith(item.href + "/") ||
          (item.href === "/ranking" && pathname.startsWith("/profissionais"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex w-full items-center gap-3 rounded-[10px] px-3.5 py-3 text-left text-[13.5px] font-semibold transition-colors",
              active ? "bg-goldsoft text-gold" : "text-muted hover:bg-goldsoft"
            )}
          >
            <span className="w-5 text-center text-[16px] opacity-85">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
