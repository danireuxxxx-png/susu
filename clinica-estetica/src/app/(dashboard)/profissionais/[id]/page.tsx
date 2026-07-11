import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfessionalProfile } from "@/lib/clinic";
import { Card } from "@/components/ui/card";
import { fmtBRL, fmtPercent, fmtDateTime, initials } from "@/lib/utils";
import { RegenerateInsightButton } from "./regenerate-insight-button";

function gradeStyle(grade: number | null) {
  if (grade === null) return { bg: "var(--card2)", color: "var(--muted)" };
  if (grade >= 8.5) return { bg: "var(--goodbg)", color: "var(--good)" };
  if (grade >= 7.5) return { bg: "var(--goldsoft)", color: "var(--gold)" };
  return { bg: "var(--badbg)", color: "var(--bad)" };
}

export default async function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfessionalProfile(id);
  if (!profile) notFound();

  const { professional, revenue, conversion, avgAi, consultCount, recentConsultations, rank, score } =
    profile;

  const kpis = [
    { label: "Faturou (30d)", value: fmtBRL(revenue) },
    { label: "Conversão", value: fmtPercent(conversion) },
    { label: "Nota IA média", value: avgAi !== null ? avgAi.toFixed(1) : "—" },
    { label: "Consultas", value: String(consultCount) },
  ];

  return (
    <div className="animate-fade-up">
      <Link href="/ranking" className="text-[12.5px] font-bold text-muted">
        ← Voltar ao ranking
      </Link>

      <div className="my-5 flex items-center gap-5.5">
        <div className="grid h-[76px] w-[76px] place-items-center rounded-full border-2 border-gold bg-goldsoft font-serif text-[28px] font-semibold text-gold">
          {initials(professional.name)}
        </div>
        <div>
          <h1 className="font-serif text-[36px] font-medium leading-none">{professional.name}</h1>
          <div className="mt-1 text-[13px] text-muted">
            {professional.specialty} · #{rank} no ranking
          </div>
        </div>
        <div className="ml-auto rounded-2xl border border-gold bg-goldsoft px-5.5 py-3.5 text-right">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
            Score combinado
          </div>
          <div className="font-serif text-[34px] font-semibold text-gold">{score}</div>
        </div>
        <Link
          href={`/profissionais/${professional.id}/editar`}
          className="rounded-full border border-line bg-card px-4 py-2.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Editar
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-4.5">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted">
              {k.label}
            </div>
            <div className="mt-2 font-serif text-[32px] font-semibold">{k.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4.5">
        <Card className="p-6">
          <div className="mb-4 font-serif text-[21px] font-semibold">
            Consultas recentes avaliadas
          </div>
          <div className="flex flex-col gap-2.5">
            {recentConsultations.length === 0 && (
              <p className="text-[13px] text-muted">Nenhuma consulta registrada ainda.</p>
            )}
            {recentConsultations.map((c) => {
              const g = gradeStyle(c.aiScore);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3.5 rounded-xl border border-line px-3.5 py-3"
                >
                  <div className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-card2 text-[11px] font-extrabold text-muted">
                    {initials(c.patient.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold">{c.treatmentName}</div>
                    <div className="text-[11.5px] text-muted">
                      {fmtDateTime(c.occurredAt)} · {fmtBRL(c.valueClosed)}
                    </div>
                  </div>
                  <div
                    className="rounded-full px-3 py-1 text-[12.5px] font-extrabold"
                    style={{ background: g.bg, color: g.color }}
                  >
                    {c.aiScore !== null ? c.aiScore.toFixed(1) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div className="font-serif text-[21px] font-semibold">
              Leitura da IA sobre o estilo de venda
            </div>
            <RegenerateInsightButton id={professional.id} />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div className="rounded-xl border border-good bg-goodbg px-4 py-3.5">
              <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-good">
                Pontos fortes
              </div>
              <div className="text-[13px] leading-relaxed">
                {professional.strengths ?? "Clique em “Atualizar leitura da IA” para gerar uma análise a partir das consultas gravadas."}
              </div>
            </div>
            <div className="rounded-xl border border-bad bg-badbg px-4 py-3.5">
              <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-bad">
                A desenvolver
              </div>
              <div className="text-[13px] leading-relaxed">
                {professional.weaknesses ?? "Ainda não há leitura da IA registrada."}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
