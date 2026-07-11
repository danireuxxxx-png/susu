import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { ProfessionalForm } from "../../professional-form";
import { updateProfessional } from "../../actions";

export default async function EditProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const professional = await db.professional.findUnique({ where: { id } });
  if (!professional) notFound();

  const action = updateProfessional.bind(null, id);

  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow="Equipe" title="Editar profissional" />
      <ProfessionalForm
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={{
          name: professional.name,
          specialty: professional.specialty,
          active: professional.active,
        }}
      />
    </div>
  );
}
