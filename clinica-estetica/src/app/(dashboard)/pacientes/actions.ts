"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generatePatientTip } from "@/lib/ai";

const patientSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo."),
  phone: z.string().trim().min(8, "Informe um telefone válido."),
  age: z.coerce.number().int().min(0).max(120),
  status: z.enum(["ATIVA", "NOVA", "EM_RISCO"]),
  currentTreatment: z.string().trim().optional(),
  nextAppointment: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  clinicalNotes: z.string().trim().optional(),
  professionalId: z.string().optional(),
  treatmentHistory: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  satisfaction: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v.replace(",", ".")) : null)),
});

export type PatientFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return patientSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    age: formData.get("age"),
    status: formData.get("status"),
    currentTreatment: formData.get("currentTreatment") ?? "",
    nextAppointment: formData.get("nextAppointment") ?? "",
    clinicalNotes: formData.get("clinicalNotes") ?? "",
    professionalId: formData.get("professionalId") || undefined,
    treatmentHistory: formData.get("treatmentHistory") ?? "",
    satisfaction: formData.get("satisfaction") ?? "",
  });
}

export async function createPatient(
  _prevState: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const patient = await db.patient.create({ data: parsed.data });
  revalidatePath("/pacientes");
  redirect(`/pacientes?id=${patient.id}`);
}

export async function updatePatient(
  id: string,
  _prevState: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.patient.update({ where: { id }, data: parsed.data });
  revalidatePath("/pacientes");
  redirect(`/pacientes?id=${id}`);
}

export async function regeneratePatientTip(id: string) {
  const patient = await db.patient.findUniqueOrThrow({ where: { id } });
  const consultations = await db.consultation.findMany({
    where: { patientId: id, valueClosed: { not: null } },
    select: { valueClosed: true },
  });
  const ltv = consultations.reduce((acc, c) => acc + (c.valueClosed ?? 0), 0);

  const result = await generatePatientTip({
    patientName: patient.name,
    age: patient.age,
    status: patient.status,
    currentTreatment: patient.currentTreatment,
    history: patient.treatmentHistory,
    notes: patient.clinicalNotes,
    ltv,
    satisfaction: patient.satisfaction,
  });

  await db.patient.update({
    where: { id },
    data: { aiTip: result.tip, aiTipAt: new Date() },
  });

  revalidatePath("/pacientes");
}
