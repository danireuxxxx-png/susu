"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateProfessionalInsight } from "@/lib/ai";

const professionalSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo."),
  specialty: z.string().trim().min(2, "Informe a especialidade."),
  active: z.boolean(),
});

export type ProfessionalFormState = { error?: string } | undefined;

export async function createProfessional(
  _prevState: ProfessionalFormState,
  formData: FormData
): Promise<ProfessionalFormState> {
  const parsed = professionalSchema.safeParse({
    name: formData.get("name"),
    specialty: formData.get("specialty"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const professional = await db.professional.create({ data: parsed.data });
  revalidatePath("/ranking");
  redirect(`/profissionais/${professional.id}`);
}

export async function updateProfessional(
  id: string,
  _prevState: ProfessionalFormState,
  formData: FormData
): Promise<ProfessionalFormState> {
  const parsed = professionalSchema.safeParse({
    name: formData.get("name"),
    specialty: formData.get("specialty"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.professional.update({ where: { id }, data: parsed.data });
  revalidatePath("/ranking");
  revalidatePath(`/profissionais/${id}`);
  redirect(`/profissionais/${id}`);
}

export async function regenerateProfessionalInsight(id: string) {
  const professional = await db.professional.findUniqueOrThrow({ where: { id } });
  const consultations = await db.consultation.findMany({
    where: { professionalId: id, aiSummary: { not: null } },
    orderBy: { occurredAt: "desc" },
    take: 8,
  });

  const analyses = consultations.map((c) => ({
    summary: c.aiSummary ?? "",
    couldSay: Array.isArray(c.couldSay) ? (c.couldSay as string[]) : [],
    avoidSay: Array.isArray(c.avoidSay) ? (c.avoidSay as string[]) : [],
    score: c.aiScore ?? 0,
  }));

  const insight = await generateProfessionalInsight({
    professionalName: professional.name,
    analyses,
  });

  await db.professional.update({
    where: { id },
    data: {
      strengths: insight.strengths,
      weaknesses: insight.weaknesses,
      insightAt: new Date(),
    },
  });

  revalidatePath(`/profissionais/${id}`);
}
