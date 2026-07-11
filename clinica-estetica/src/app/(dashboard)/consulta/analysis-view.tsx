"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { ConsultationAnalysis } from "@/lib/ai";
import { saveConsultationOutcome } from "./actions";

function gradeColor(g: number) {
  if (g >= 8.5) return "var(--good)";
  if (g >= 7.5) return "var(--gold)";
  return "var(--bad)";
}

export function AnalysisView({
  analysis,
  consultationId,
  patientName,
  professionalName,
  durationSeconds,
  onReset,
}: {
  analysis: ConsultationAnalysis;
  consultationId: string;
  patientName: string;
  professionalName: string;
  durationSeconds: number;
  onReset: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [valueClosed, setValueClosed] = useState("");
  const [planSessions, setPlanSessions] = useState("");

  function handleSave() {
    startTransition(async () => {
      await saveConsultationOutcome({
        consultationId,
        valueClosed: valueClosed ? Number(valueClosed.replace(",", ".")) : undefined,
        planSessions: planSessions ? Number(planSessions) : undefined,
      });
      setSaved(true);
    });
  }

  const facts = [
    { label: "Paciente", value: patientName },
    { label: "Profissional", value: professionalName },
    { label: "Duração", value: `${Math.round(durationSeconds / 60)} min` },
    { label: "Tratamento", value: analysis.treatmentSuggested },
    { label: "Objeções", value: analysis.facts.objections },
    { label: "Sentimento final", value: analysis.facts.finalSentiment },
    { label: "Silêncios longos", value: analysis.facts.longSilences },
    { label: "Indicou a clínica?", value: analysis.facts.referredClinic },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-4.5 grid grid-cols-[auto_1fr] gap-4.5">
        <Card
          className="grid place-items-center px-10 py-7.5 text-center"
          style={{ background: "linear-gradient(150deg,var(--goldsoft),transparent), var(--card)" }}
        >
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold">
              Nota da consulta
            </div>
            <div className="font-serif text-[76px] font-semibold leading-tight text-gold">
              {analysis.score.toFixed(1)}
            </div>
            <div className="text-[12px] font-bold text-muted">de 10</div>
          </div>
        </Card>
        <Card className="p-6.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="font-serif text-[21px] font-semibold">Resumo da IA</div>
            <div className="text-[11.5px] font-semibold text-muted">
              {professionalName} · {analysis.treatmentSuggested} · {Math.round(durationSeconds / 60)}{" "}
              min
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed">{analysis.summary}</p>
          <button
            onClick={onReset}
            className="mt-4 rounded-full border border-line px-5 py-2.5 text-[12.5px] font-bold text-muted transition-colors hover:border-gold hover:text-gold"
          >
            ↻ Nova gravação
          </button>
        </Card>
      </div>

      <div className="mb-4.5 grid grid-cols-[1.4fr_1fr] gap-4.5">
        <Card className="p-6.5">
          <div className="mb-4 font-serif text-[21px] font-semibold">Dados da consulta</div>
          <div className="grid grid-cols-4 gap-3.5">
            {facts.map((f) => (
              <div key={f.label} className="rounded-xl bg-card2 px-3.5 py-3.5">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  {f.label}
                </div>
                <div className="mt-1 text-[13.5px] font-bold">{f.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4.5">
            <div className="mb-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Equilíbrio de fala
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full">
              <div
                className="h-full"
                style={{
                  width: `${analysis.speakingBalancePro}%`,
                  background: "linear-gradient(90deg,var(--gold),var(--gold2))",
                }}
              />
              <div className="h-full flex-1 bg-card2" />
            </div>
            <div className="mt-1.5 flex justify-between text-[11.5px] font-semibold text-muted">
              <span className="text-gold">Profissional {analysis.speakingBalancePro}%</span>
              <span>Paciente {100 - analysis.speakingBalancePro}% · ideal: ≤ 50% para o profissional</span>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-line px-4 py-4">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Resultado financeiro
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11.5px] font-semibold text-muted">Valor fechado (R$)</label>
                <input
                  value={valueClosed}
                  onChange={(e) => setValueClosed(e.target.value)}
                  placeholder="ex: 3400"
                  className="w-36 rounded-lg border border-line bg-card px-3 py-2 text-[13px] outline-none focus:border-gold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11.5px] font-semibold text-muted">Sessões do plano</label>
                <input
                  value={planSessions}
                  onChange={(e) => setPlanSessions(e.target.value)}
                  placeholder="ex: 3"
                  className="w-28 rounded-lg border border-line bg-card px-3 py-2 text-[13px] outline-none focus:border-gold"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={pending}
                className="rounded-lg bg-gradient-to-br from-gold to-gold2 px-4 py-2 text-[12.5px] font-bold text-[#fffdfa] disabled:opacity-60"
              >
                {pending ? "Salvando…" : saved ? "Salvo ✓" : "Salvar"}
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-6.5">
          <div className="mb-4 font-serif text-[21px] font-semibold">Notas por competência</div>
          <div className="flex flex-col gap-3.5">
            {analysis.subScores.map((s) => (
              <div key={s.label}>
                <div className="mb-1.5 flex justify-between text-[12.5px]">
                  <span className="font-bold">{s.label}</span>
                  <span className="font-extrabold" style={{ color: gradeColor(s.grade) }}>
                    {s.grade.toFixed(1)}
                  </span>
                </div>
                <ProgressBar percent={s.grade * 10} color={gradeColor(s.grade)} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4.5">
        <Card className="p-6.5">
          <div className="font-serif text-[21px] font-semibold">Transcrição com marcações</div>
          <div className="mb-4.5 mt-1 flex gap-4 text-[11.5px] font-bold text-muted">
            <span style={{ color: "var(--good)" }}>● momento forte</span>
            <span style={{ color: "var(--bad)" }}>● poderia evitar</span>
          </div>
          <div className="flex max-h-[440px] flex-col gap-3.5 overflow-auto pr-2">
            {analysis.transcript.map((seg, i) => {
              const edge =
                seg.mark === "good" ? "var(--good)" : seg.mark === "bad" ? "var(--bad)" : "var(--line)";
              const bg =
                seg.mark === "good" ? "var(--goodbg)" : seg.mark === "bad" ? "var(--badbg)" : "transparent";
              return (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3.5"
                  style={{ borderLeft: `3px solid ${edge}`, background: bg }}
                >
                  <div className="mb-1 flex justify-between gap-2.5">
                    <span
                      className="text-[11px] font-extrabold uppercase tracking-[0.08em]"
                      style={{ color: seg.speaker === "Paciente" ? "var(--muted)" : "var(--gold)" }}
                    >
                      {seg.speaker}
                    </span>
                  </div>
                  <div className="text-[13.5px] leading-relaxed">{seg.text}</div>
                  {seg.note && (
                    <div
                      className="mt-2 text-[12px] font-semibold leading-snug"
                      style={{ color: seg.mark === "bad" ? "var(--bad)" : "var(--good)" }}
                    >
                      ✦ {seg.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-4.5">
          <Card className="p-6">
            <div className="mb-3.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-good">
              O que poderia ter dito
            </div>
            <div className="flex flex-col gap-3">
              {analysis.couldSay.map((s, i) => (
                <div key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
                  <span className="font-extrabold text-good">+</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="mb-3.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-bad">
              O que não era necessário
            </div>
            <div className="flex flex-col gap-3">
              {analysis.avoidSay.map((s, i) => (
                <div key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
                  <span className="font-extrabold text-bad">−</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
