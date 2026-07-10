"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateLiveTips, generateConsultationAnalysis, type ConsultationAnalysis } from "@/lib/ai";

export async function fetchLiveTips(input: {
  transcriptSoFar: string;
  patientId: string;
  professionalId: string;
}) {
  const [patient, professional] = await Promise.all([
    db.patient.findUniqueOrThrow({ where: { id: input.patientId } }),
    db.professional.findUniqueOrThrow({ where: { id: input.professionalId } }),
  ]);

  return generateLiveTips({
    transcriptSoFar: input.transcriptSoFar,
    patientName: patient.name,
    professionalName: professional.name,
    treatmentHint: patient.currentTreatment,
  });
}

const finalizeSchema = z.object({
  patientId: z.string().min(1),
  professionalId: z.string().min(1),
  rawTranscript: z.string().min(1),
  durationSeconds: z.coerce.number().int().min(1),
});

function distributeTimes(
  segments: ConsultationAnalysis["transcript"],
  durationSeconds: number
) {
  const totalChars = segments.reduce((acc, s) => acc + s.text.length, 0) || 1;
  let elapsed = 0;
  return segments.map((s) => {
    const startSeconds = Math.round(elapsed);
    elapsed += (s.text.length / totalChars) * durationSeconds;
    const m = Math.floor(startSeconds / 60);
    const sec = startSeconds % 60;
    return { ...s, time: `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` };
  });
}

export async function finalizeConsultation(input: {
  patientId: string;
  professionalId: string;
  rawTranscript: string;
  durationSeconds: number;
}) {
  const parsed = finalizeSchema.parse(input);

  const [patient, professional] = await Promise.all([
    db.patient.findUniqueOrThrow({ where: { id: parsed.patientId } }),
    db.professional.findUniqueOrThrow({ where: { id: parsed.professionalId } }),
  ]);

  const analysis = await generateConsultationAnalysis({
    rawTranscript: parsed.rawTranscript,
    patientName: patient.name,
    patientNotes: patient.clinicalNotes,
    professionalName: professional.name,
    durationSeconds: parsed.durationSeconds,
  });

  const transcriptWithTimes = distributeTimes(analysis.transcript, parsed.durationSeconds);

  const consultation = await db.consultation.create({
    data: {
      patientId: parsed.patientId,
      professionalId: parsed.professionalId,
      treatmentName: analysis.treatmentSuggested || patient.currentTreatment || "Consulta geral",
      durationSeconds: parsed.durationSeconds,
      transcript: transcriptWithTimes,
      aiScore: analysis.score,
      aiSummary: analysis.summary,
      subScores: analysis.subScores,
      aiFacts: analysis.facts,
      couldSay: analysis.couldSay,
      avoidSay: analysis.avoidSay,
      speakingBalancePro: analysis.speakingBalancePro,
    },
  });

  revalidatePath("/overview");
  revalidatePath("/ranking");
  revalidatePath(`/profissionais/${parsed.professionalId}`);

  return {
    consultationId: consultation.id,
    analysis: { ...analysis, transcript: transcriptWithTimes },
  };
}

const outcomeSchema = z.object({
  consultationId: z.string().min(1),
  valueClosed: z.coerce.number().min(0).optional(),
  planSessions: z.coerce.number().int().min(0).optional(),
});

export async function saveConsultationOutcome(input: {
  consultationId: string;
  valueClosed?: number;
  planSessions?: number;
}) {
  const parsed = outcomeSchema.parse(input);
  await db.consultation.update({
    where: { id: parsed.consultationId },
    data: {
      valueClosed: parsed.valueClosed ?? null,
      planSessions: parsed.planSessions ?? null,
    },
  });
  revalidatePath("/overview");
  revalidatePath("/pacientes");
}
