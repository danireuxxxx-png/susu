"use client";

import { useActionState } from "react";
import type { ProfessionalFormState } from "./actions";

export function ProfessionalForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: ProfessionalFormState, formData: FormData) => Promise<ProfessionalFormState>;
  defaultValues?: { name: string; specialty: string; active: boolean };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-[480px] flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-[12.5px] font-semibold text-muted">
          Nome completo
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder="Dra. Nome Sobrenome"
          className="rounded-[10px] border border-line bg-card px-4 py-3 text-[14px] text-ink outline-none focus:border-gold"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="specialty" className="text-[12.5px] font-semibold text-muted">
          Especialidade
        </label>
        <input
          id="specialty"
          name="specialty"
          required
          defaultValue={defaultValues?.specialty}
          placeholder="Harmonização Facial"
          className="rounded-[10px] border border-line bg-card px-4 py-3 text-[14px] text-ink outline-none focus:border-gold"
        />
      </div>
      <label className="flex items-center gap-2.5 text-[13px] font-semibold text-ink">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="h-4 w-4 accent-[var(--gold)]"
        />
        Profissional ativa na clínica
      </label>

      {state?.error && (
        <div className="rounded-[10px] border border-bad bg-badbg px-4 py-2.5 text-[12.5px] font-semibold text-bad">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-fit rounded-[10px] bg-gradient-to-br from-gold to-gold2 px-6 py-3 text-[13.5px] font-bold text-[#fffdfa] disabled:opacity-60"
      >
        {pending ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}
