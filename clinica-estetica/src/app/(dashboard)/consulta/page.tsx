import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { ConsultationRecorder } from "./consultation-recorder";

export default async function ConsultaPage() {
  const [patients, professionals] = await Promise.all([
    db.patient.findMany({
      select: { id: true, name: true, currentTreatment: true },
      orderBy: { name: "asc" },
    }),
    db.professional.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow="Copiloto de consulta" title="Gravação & análise da consulta" />
      <ConsultationRecorder patients={patients} professionals={professionals} />
    </div>
  );
}
