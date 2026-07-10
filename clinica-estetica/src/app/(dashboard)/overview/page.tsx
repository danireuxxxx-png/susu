import Link from "next/link";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { DailyRevenueBars } from "@/components/charts/daily-revenue-bars";
import {
  getKpis,
  getDailyRevenue,
  getTopTreatments,
  getClientStats,
  getProfessionalsRanking,
} from "@/lib/clinic";
import { fmtBRL, fmtPercent, fmtNumber, initials } from "@/lib/utils";

function DeltaLabel({ value, invert = false }: { value: number; invert?: boolean }) {
  const positive = invert ? value <= 0 : value >= 0;
  const arrow = value >= 0 ? "▲" : "▼";
  return (
    <span style={{ color: positive ? "var(--good)" : "var(--bad)" }}>
      {arrow} {fmtPercent(Math.abs(value), 1)}
    </span>
  );
}

export default async function OverviewPage() {
  const session = await auth();
  const displayName = session?.user?.name?.replace(/^(Dra?\.)\s*(\S+).*$/i, "$1 $2") ?? "Doutora";

  const [kpis, dailyRevenue, topTreatments, clientStats, ranking] = await Promise.all([
    getKpis(),
    getDailyRevenue(),
    getTopTreatments(),
    getClientStats(),
    getProfessionalsRanking(),
  ]);

  const maxTreatment = Math.max(...topTreatments.map((t) => t.value), 1);
  const top3 = ranking.slice(0, 3);
  const medals = ["①", "②", "③"];

  const kpiCards = [
    { label: "Faturamento", value: fmtBRL(kpis.revenue), delta: kpis.revenueDelta },
    { label: "Ticket médio", value: fmtBRL(kpis.ticket), delta: kpis.ticketDelta },
    { label: "Consultas realizadas", value: fmtNumber(kpis.count), delta: kpis.countDelta },
    {
      label: "Taxa de conversão",
      value: fmtPercent(kpis.conversion),
      delta: kpis.conversionDelta,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Visão geral"
        title={`Bom dia, ${displayName}`}
        action={
          <div className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-[12.5px] font-semibold text-muted">
            ◷ Últimos 30 dias
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-4 gap-4.5">
        {kpiCards.map((k) => (
          <Card key={k.label} className="p-5.5">
            <div className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted">
              {k.label}
            </div>
            <div className="my-2.5 font-serif text-[36px] font-semibold leading-none tracking-tight">
              {k.value}
            </div>
            <div className="text-[12px] font-bold">
              <DeltaLabel value={k.delta} invert={k.label === "Taxa de conversão"} />{" "}
              <span className="font-medium text-muted">vs. mês anterior</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-[1.7fr_1fr] gap-4.5">
        <Card className="p-6.5">
          <div className="mb-5.5 flex items-baseline justify-between">
            <div>
              <div className="font-serif text-[22px] font-semibold">Faturamento diário</div>
              <div className="mt-0.5 text-[12px] text-muted">
                {fmtBRL(kpis.revenue)} acumulado no período
              </div>
            </div>
            <div className="text-[12px] font-bold">
              <DeltaLabel value={kpis.revenueDelta} />
            </div>
          </div>
          <DailyRevenueBars data={dailyRevenue} />
        </Card>

        <Card className="p-6.5">
          <div className="mb-5 font-serif text-[22px] font-semibold">Top tratamentos</div>
          <div className="flex flex-col gap-4">
            {topTreatments.map((t) => (
              <div key={t.name}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="font-semibold">{t.name}</span>
                  <span className="font-semibold text-muted">{fmtBRL(t.value)}</span>
                </div>
                <ProgressBar percent={(t.value / maxTreatment) * 100} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[1fr_1.7fr] gap-4.5">
        <Card
          className="p-6.5"
          style={{ background: "linear-gradient(150deg, var(--card), var(--card2))" }}
        >
          <div className="mb-1 font-serif text-[22px] font-semibold">Clientes</div>
          <div className="mb-5.5 text-[12px] text-muted">Base ativa e retenção</div>
          <div className="grid grid-cols-2 gap-4.5">
            <div>
              <div className="font-serif text-[32px] font-semibold">{clientStats.active}</div>
              <div className="text-[11.5px] font-semibold text-muted">clientes ativos</div>
            </div>
            <div>
              <div className="font-serif text-[32px] font-semibold">{clientStats.newPatients}</div>
              <div className="text-[11.5px] font-semibold text-muted">novas no período</div>
            </div>
            <div>
              <div className="font-serif text-[32px] font-semibold">
                {fmtPercent(clientStats.retentionRate)}
              </div>
              <div className="text-[11.5px] font-semibold text-muted">taxa de retorno</div>
            </div>
            <div>
              <div className="font-serif text-[32px] font-semibold">
                {clientStats.avgSatisfaction ? clientStats.avgSatisfaction.toFixed(1) : "—"}
              </div>
              <div className="text-[11.5px] font-semibold text-muted">satisfação média ★</div>
            </div>
          </div>
        </Card>

        <Card className="p-6.5">
          <div className="mb-4.5 flex items-baseline justify-between">
            <div className="font-serif text-[22px] font-semibold">Ranking da equipe</div>
            <Link href="/ranking" className="text-[12.5px] font-bold">
              Ver completo →
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {top3.map((p, i) => (
              <Link
                key={p.professional.id}
                href={`/profissionais/${p.professional.id}`}
                className="flex items-center gap-3.5 rounded-xl border border-line px-3.5 py-3 text-ink transition-colors hover:border-gold hover:bg-goldsoft"
              >
                <span className="w-5.5 font-serif text-[20px] font-semibold text-gold">
                  {medals[i]}
                </span>
                <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-goldsoft text-[12px] font-extrabold text-gold">
                  {initials(p.professional.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold">
                    {p.professional.name}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted">
                    {p.professional.specialty}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[13.5px] font-extrabold">{fmtBRL(p.revenue)}</span>
                  <span className="block text-[11px] font-bold text-gold">score {p.score}</span>
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
