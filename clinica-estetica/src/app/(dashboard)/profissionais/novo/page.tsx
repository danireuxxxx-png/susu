import { PageHeader } from "@/components/ui/page-header";
import { ProfessionalForm } from "../professional-form";
import { createProfessional } from "../actions";

export default function NewProfessionalPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow="Equipe" title="Nova profissional" />
      <ProfessionalForm action={createProfessional} submitLabel="Criar profissional" />
    </div>
  );
}
