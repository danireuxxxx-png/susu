"use client";

import { useState, useTransition } from "react";
import { regenerateProfessionalInsight } from "../actions";

export function RegenerateInsightButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await regenerateProfessionalInsight(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível gerar a leitura da IA.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded-full border border-line px-4 py-2 text-[12px] font-bold text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
      >
        {pending ? "Analisando…" : "↻ Atualizar leitura da IA"}
      </button>
      {error && <div className="max-w-[280px] text-right text-[11.5px] text-bad">{error}</div>}
    </div>
  );
}
