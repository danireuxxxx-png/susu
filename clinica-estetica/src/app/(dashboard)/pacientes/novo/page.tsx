import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { PatientForm } from "../patient-form";
import { createPatient } from "../actions";

export default async function NewPatientPage() {
  const professionals = await db.professional.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow="Base de clientes" title="Nova paciente" />
      <PatientForm action={createPatient} professionals={professionals} submitLabel="Criar paciente" />
    </div>
  );
}
