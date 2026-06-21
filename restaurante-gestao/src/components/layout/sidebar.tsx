"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  UserCheck,
  Target,
  BarChart3,
  Package,
  UtensilsCrossed,
  Settings,
  ChefHat,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faturamento", label: "Faturamento", icon: DollarSign },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/rh", label: "RH & Folha", icon: UserCheck },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="font-bold text-lg leading-tight">RestaurantePRO</h1>
            <p className="text-xs text-gray-400">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-orange-500 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings className="h-5 w-5" />
          Configurações
        </Link>
      </div>
    </aside>
  );
}
