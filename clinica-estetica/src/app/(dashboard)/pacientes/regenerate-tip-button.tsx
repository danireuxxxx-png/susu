"use client";

import { useState, useTransition } from "react";
import { regeneratePatientTip } from "./actions";

export function RegenerateTipButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await regeneratePatientTip(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível gerar a sugestão.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className="w-fit text-[10.5px] font-bold text-gold underline decoration-dotted disabled:opacity-60"
      >
        {pending ? "Analisando…" : "↻ gerar nova sugestão"}
      </button>
      {error && <div className="text-[11px] text-bad">{error}</div>}
    </div>
  );
}
