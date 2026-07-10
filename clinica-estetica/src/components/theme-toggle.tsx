"use client";

import { useState, useTransition } from "react";
import { setTheme } from "@/app/theme-actions";

export function ThemeToggle({ initialTheme }: { initialTheme: "light" | "dark" }) {
  const [theme, setLocalTheme] = useState(initialTheme);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setLocalTheme(next);
    document.documentElement.dataset.theme = next;
    startTransition(() => {
      setTheme(next);
    });
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center gap-2 rounded-[10px] border border-line px-3 py-2.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
    >
      {theme === "light" ? "☾ Modo escuro" : "☀ Modo claro"}
    </button>
  );
}
