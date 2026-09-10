import { PageHeader } from "@/components/ui/page-header";
import { AGENTS, CATEGORIAS } from "@/lib/agent-catalog";
import { CatalogExplorer } from "./catalog-explorer";

export const metadata = {
  title: "Catálogo de Agentes",
};

export default function CatalogoPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Pré-venda de soluções"
        title="Catálogo de Agentes"
        action={
          <div className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-[12.5px] font-semibold text-muted">
            {AGENTS.length} agentes · {CATEGORIAS.length} categorias
          </div>
        }
      />
      <CatalogExplorer />
    </div>
  );
}
