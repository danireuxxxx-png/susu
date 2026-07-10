import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getProfessionalsRanking } from "@/lib/clinic";
import { fmtBRL, fmtPercent, initials } from "@/lib/utils";

export default async function RankingPage() {
  const ranking = await getProfessionalsRanking();
  const medals = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Equipe"
        title="Ranking dos profissionais"
        action={
          <Link
            href="/profissionais/novo"
            className="rounded-full border border-line bg-card px-4 py-2.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
          >
            + Nova profissional
          </Link>
        }
      />
      <p className="mb-7 max-w-[560px] text-[13.5px] text-muted">
        Score combinado: 40% faturamento · 30% taxa de conversão · 30% nota das consultas
        avaliadas pela IA (últimos 30 dias).
      </p>

      <div className="flex flex-col gap-3">
        {ranking.map((p, i) => (
          <Link
            key={p.professional.id}
            href={`/profissionais/${p.professional.id}`}
            className="grid grid-cols-[56px_2fr_1fr_1fr_1fr_1.4fr] items-center gap-4.5 rounded-2xl border bg-card px-6 py-4.5 text-ink shadow-[var(--shadow)] transition-all hover:-translate-y-0.5"
            style={{ borderColor: i === 0 ? "var(--gold)" : "var(--line)" }}
          >
            <span
              className="font-serif text-[30px] font-semibold"
              style={{ color: i === 0 ? "var(--gold)" : "var(--muted)" }}
            >
              {medals[i] ?? i + 1}
            </span>
            <span className="flex min-w-0 items-center gap-3.5">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-goldsoft text-[13px] font-extrabold text-gold">
                {initials(p.professional.name)}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold">{p.professional.name}</span>
                <span className="block text-[12px] text-muted">{p.professional.specialty}</span>
              </span>
            </span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                Faturou
              </span>
              <span className="mt-0.5 block text-[15px] font-extrabold">
                {fmtBRL(p.revenue)}
              </span>
            </span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                Conversão
              </span>
              <span className="mt-0.5 block text-[15px] font-extrabold">
                {fmtPercent(p.conversion)}
              </span>
            </span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                Nota IA
              </span>
              <span className="mt-0.5 block text-[15px] font-extrabold text-gold">
                {p.avgAi !== null ? p.avgAi.toFixed(1) : "—"}
              </span>
            </span>
            <span>
              <span className="flex justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                <span>Score</span>
                <span className="text-ink">{p.score}</span>
              </span>
              <div className="mt-1.5">
                <ProgressBar percent={p.score} height={7} />
              </div>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
