import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { toDatetimeLocal } from "@/lib/utils";
import { PatientForm } from "../../patient-form";
import { updatePatient } from "../../actions";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patient, professionals] = await Promise.all([
    db.patient.findUnique({ where: { id } }),
    db.professional.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!patient) notFound();

  const action = updatePatient.bind(null, id);

  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow="Base de clientes" title="Editar paciente" />
      <PatientForm
        action={action}
        professionals={professionals}
        submitLabel="Salvar alterações"
        defaultValues={{
          name: patient.name,
          phone: patient.phone,
          age: patient.age,
          status: patient.status,
          currentTreatment: patient.currentTreatment,
          nextAppointment: toDatetimeLocal(patient.nextAppointment),
          clinicalNotes: patient.clinicalNotes,
          professionalId: patient.professionalId,
          treatmentHistory: patient.treatmentHistory,
          satisfaction: patient.satisfaction,
        }}
      />
    </div>
  );
}
