"use client";

import { useActionState } from "react";
import type { PatientFormState } from "./actions";

type Professional = { id: string; name: string };

export function PatientForm({
  action,
  professionals,
  defaultValues,
  submitLabel,
}: {
  action: (state: PatientFormState, formData: FormData) => Promise<PatientFormState>;
  professionals: Professional[];
  defaultValues?: {
    name: string;
    phone: string;
    age: number;
    status: string;
    currentTreatment: string | null;
    nextAppointment: string | null;
    clinicalNotes: string | null;
    professionalId: string | null;
    treatmentHistory: string[];
    satisfaction: number | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const inputClass =
    "rounded-[10px] border border-line bg-card px-4 py-3 text-[14px] text-ink outline-none focus:border-gold";
  const labelClass = "text-[12.5px] font-semibold text-muted";

  return (
    <form action={formAction} className="grid max-w-[720px] grid-cols-2 gap-5">
      <div className="col-span-2 flex flex-col gap-1.5">
        <label htmlFor="name" className={labelClass}>
          Nome completo
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className={labelClass}>
          Telefone
        </label>
        <input
          id="phone"
          name="phone"
          required
          defaultValue={defaultValues?.phone}
          placeholder="(11) 90000-0000"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="age" className={labelClass}>
          Idade
        </label>
        <input
          id="age"
          name="age"
          type="number"
          min={0}
          max={120}
          required
          defaultValue={defaultValues?.age}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className={labelClass}>
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "NOVA"}
          className={inputClass}
        >
          <option value="NOVA">Nova</option>
          <option value="ATIVA">Ativa</option>
          <option value="EM_RISCO">Em risco</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="professionalId" className={labelClass}>
          Profissional responsável
        </label>
        <select
          id="professionalId"
          name="professionalId"
          defaultValue={defaultValues?.professionalId ?? ""}
          className={inputClass}
        >
          <option value="">Sem profissional definido</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <label htmlFor="currentTreatment" className={labelClass}>
          Tratamento atual / desejado
        </label>
        <input
          id="currentTreatment"
          name="currentTreatment"
          defaultValue={defaultValues?.currentTreatment ?? ""}
          placeholder="Harmonização facial · sessão 1 de 3"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nextAppointment" className={labelClass}>
          Próxima consulta
        </label>
        <input
          id="nextAppointment"
          name="nextAppointment"
          type="datetime-local"
          defaultValue={defaultValues?.nextAppointment ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="satisfaction" className={labelClass}>
          Satisfação (0 a 5)
        </label>
        <input
          id="satisfaction"
          name="satisfaction"
          type="number"
          step="0.1"
          min={0}
          max={5}
          defaultValue={defaultValues?.satisfaction ?? ""}
          className={inputClass}
        />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <label htmlFor="treatmentHistory" className={labelClass}>
          Já realizou na clínica (separado por vírgula)
        </label>
        <input
          id="treatmentHistory"
          name="treatmentHistory"
          defaultValue={defaultValues?.treatmentHistory.join(", ") ?? ""}
          placeholder="Toxina botulínica, Skinbooster"
          className={inputClass}
        />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <label htmlFor="clinicalNotes" className={labelClass}>
          Observações clínicas
        </label>
        <textarea
          id="clinicalNotes"
          name="clinicalNotes"
          rows={3}
          defaultValue={defaultValues?.clinicalNotes ?? ""}
          className={inputClass}
        />
      </div>

      {state?.error && (
        <div className="col-span-2 rounded-[10px] border border-bad bg-badbg px-4 py-2.5 text-[12.5px] font-semibold text-bad">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="col-span-2 mt-1 w-fit rounded-[10px] bg-gradient-to-br from-gold to-gold2 px-6 py-3 text-[13.5px] font-bold text-[#fffdfa] disabled:opacity-60"
      >
        {pending ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}
