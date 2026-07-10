import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getPatientsList, getPatientDetail, getClientStats, tagStyleForStatus } from "@/lib/clinic";
import { fmtBRL, fmtDateTime, initials } from "@/lib/utils";
import { RegenerateTipButton } from "./regenerate-tip-button";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const [patients, clientStats] = await Promise.all([getPatientsList(), getClientStats()]);
  const selectedId = id ?? patients[0]?.id;
  const detail = selectedId ? await getPatientDetail(selectedId) : null;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Base de clientes"
        title="Pacientes"
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-[12.5px] font-semibold text-muted">
              {clientStats.active} ativas · {clientStats.newPatients} novas no período
            </div>
            <Link
              href="/pacientes/novo"
              className="rounded-full border border-line bg-card px-4 py-2.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
            >
              + Nova paciente
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(340px,1fr)] items-start gap-4.5">
        <div className="flex flex-col gap-2.5">
          {patients.map((p) => {
            const tag = tagStyleForStatus(p.status);
            const active = p.id === selectedId;
            return (
              <Link
                key={p.id}
                href={`/pacientes?id=${p.id}`}
                className="grid grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border px-4.5 py-4 text-ink shadow-[var(--shadow)] transition-colors"
                style={{
                  borderColor: active ? "var(--gold)" : "var(--line)",
                  background: active ? "var(--goldsoft)" : "var(--card)",
                }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-goldsoft text-[12px] font-extrabold text-gold">
                  {initials(p.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-bold">{p.name}</span>
                  <span className="block truncate text-[11.5px] text-muted">
                    {p.age} anos · {p.phone}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold">
                    {p.currentTreatment ?? "—"}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    próx.:{" "}
                    {p.nextAppointment ? fmtDateTime(p.nextAppointment) : "não agendada"}
                  </span>
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
                  style={{ background: tag.bg, color: tag.color }}
                >
                  {tag.label}
                </span>
              </Link>
            );
          })}
        </div>

        {detail && (
          <Card className="sticky top-6 border-gold p-7.5">
            <div className="mb-5 flex items-center gap-4">
              <div className="grid h-[58px] w-[58px] place-items-center rounded-full border-2 border-gold bg-goldsoft font-serif text-[22px] font-semibold text-gold">
                {initials(detail.patient.name)}
              </div>
              <div className="min-w-0">
                <div className="font-serif text-[26px] font-semibold">{detail.patient.name}</div>
                <div className="text-[12px] text-muted">
                  {detail.patient.age} anos · {detail.patient.phone} · cliente desde{" "}
                  {detail.patient.clientSince.toLocaleDateString("pt-BR", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <Link
                href={`/pacientes/${detail.patient.id}/editar`}
                className="ml-auto rounded-full border border-line px-3.5 py-2 text-[12px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
              >
                Editar
              </Link>
            </div>

            <div className="mb-4.5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-card2 px-3.5 py-3.5">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  Total investido
                </div>
                <div className="mt-1 font-serif text-[22px] font-semibold">
                  {fmtBRL(detail.ltv)}
                </div>
              </div>
              <div className="rounded-xl bg-card2 px-3.5 py-3.5">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  Ticket médio
                </div>
                <div className="mt-1 font-serif text-[22px] font-semibold">
                  {fmtBRL(detail.ticket)}
                </div>
              </div>
              <div className="rounded-xl bg-card2 px-3.5 py-3.5">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  Satisfação
                </div>
                <div className="mt-1 font-serif text-[22px] font-semibold text-gold">
                  {detail.patient.satisfaction !== null
                    ? `${detail.patient.satisfaction.toFixed(1)} ★`
                    : "—"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <div>
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gold">
                  Tratamento atual / desejado
                </div>
                <div className="text-[13.5px] font-semibold">
                  {detail.patient.currentTreatment ?? "—"}
                </div>
                <div className="mt-0.5 text-[12px] text-muted">
                  {detail.patient.professional
                    ? `com ${detail.patient.professional.name}`
                    : "sem profissional definido"}{" "}
                  · próxima consulta:{" "}
                  {detail.patient.nextAppointment
                    ? fmtDateTime(detail.patient.nextAppointment)
                    : "não agendada"}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gold">
                  Já realizou na clínica
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detail.patient.treatmentHistory.length === 0 && (
                    <span className="rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-muted">
                      Nenhum — primeira visita
                    </span>
                  )}
                  {detail.patient.treatmentHistory.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-muted"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {detail.patient.clinicalNotes && (
                <div className="rounded-xl border border-bad bg-badbg px-4 py-3.5">
                  <div className="mb-1 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-bad">
                    Observações clínicas
                  </div>
                  <div className="text-[12.5px] leading-relaxed">
                    {detail.patient.clinicalNotes}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-goldsoft px-4 py-3.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-gold">
                    Sugestão da IA
                  </div>
                  <RegenerateTipButton id={detail.patient.id} />
                </div>
                <div className="text-[12.5px] leading-relaxed">
                  {detail.patient.aiTip ?? "Sem sugestão gerada ainda."}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
