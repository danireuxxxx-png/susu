"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { fmtTime } from "@/lib/utils";
import { getSpeechRecognitionCtor, type SpeechRecognitionLike } from "@/components/speech-recognition-types";
import { fetchLiveTips, finalizeConsultation } from "./actions";
import { AnalysisView } from "./analysis-view";
import type { ConsultationAnalysis, LiveTip } from "@/lib/ai";

type Patient = { id: string; name: string; currentTreatment: string | null };
type Professional = { id: string; name: string };

type Phase = "setup" | "recording" | "analyzing" | "done";

export function ConsultationRecorder({
  patients,
  professionals,
}: {
  patients: Patient[];
  professionals: Professional[];
}) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? "");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [liveTips, setLiveTips] = useState<LiveTip[]>([]);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ConsultationAnalysis | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);

  const [, startFinalize] = useTransition();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stopRequestedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTipsLengthRef = useRef(0);
  const tipsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser capability detection, avoids SSR/CSR hydration mismatch
    setSpeechSupported(!!getSpeechRecognitionCtor());
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tipsTimerRef.current) clearInterval(tipsTimerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  function startRecording() {
    setErrorMsg(null);
    setTranscript("");
    setSeconds(0);
    setLiveTips([]);
    lastTipsLengthRef.current = 0;
    stopRequestedRef.current = false;

    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

    const Ctor = getSpeechRecognitionCtor();
    if (Ctor) {
      const recognition = new Ctor();
      recognition.lang = "pt-BR";
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0].transcript + " ";
        }
        if (finalText) setTranscript((prev) => (prev + " " + finalText).trim());
      };
      recognition.onerror = () => {};
      recognition.onend = () => {
        if (!stopRequestedRef.current) {
          try {
            recognition.start();
          } catch {
            // already started
          }
        }
      };
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        setErrorMsg("Não foi possível acessar o microfone. Você pode digitar a transcrição manualmente abaixo.");
      }
    }

    tipsTimerRef.current = setInterval(() => {
      setTranscript((current) => {
        if (current.length - lastTipsLengthRef.current > 40) {
          lastTipsLengthRef.current = current.length;
          fetchLiveTips({ transcriptSoFar: current, patientId, professionalId })
            .then((res) => setLiveTips(res.tips))
            .catch(() => {});
        }
        return current;
      });
    }, 12000);

    setPhase("recording");
  }

  function stopRecording() {
    stopRequestedRef.current = true;
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (tipsTimerRef.current) clearInterval(tipsTimerRef.current);
    setPhase("analyzing");

    startFinalize(async () => {
      try {
        const result = await finalizeConsultation({
          patientId,
          professionalId,
          rawTranscript: transcript,
          durationSeconds: Math.max(seconds, 1),
        });
        setAnalysis(result.analysis);
        setConsultationId(result.consultationId);
        setPhase("done");
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Não foi possível analisar a consulta.");
        setPhase("recording");
      }
    });
  }

  function reset() {
    setPhase("setup");
    setAnalysis(null);
    setConsultationId(null);
    setTranscript("");
    setSeconds(0);
    setLiveTips([]);
    setErrorMsg(null);
  }

  const patient = patients.find((p) => p.id === patientId);
  const professional = professionals.find((p) => p.id === professionalId);

  if (phase === "done" && analysis && consultationId && patient && professional) {
    return (
      <AnalysisView
        analysis={analysis}
        consultationId={consultationId}
        patientName={patient.name}
        professionalName={professional.name}
        durationSeconds={seconds}
        onReset={reset}
      />
    );
  }

  return (
    <div className="animate-fade-up">
      {(phase === "setup" || phase === "recording") && (
        <div className="mb-6 flex flex-wrap gap-3.5">
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            disabled={phase === "recording"}
            className="rounded-[10px] border border-line bg-card px-4 py-2.5 text-[13.5px] font-semibold outline-none focus:border-gold disabled:opacity-60"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                Paciente: {p.name}
              </option>
            ))}
          </select>
          <select
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            disabled={phase === "recording"}
            className="rounded-[10px] border border-line bg-card px-4 py-2.5 text-[13.5px] font-semibold outline-none focus:border-gold disabled:opacity-60"
          >
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                Profissional: {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 rounded-xl border border-bad bg-badbg px-4 py-3 text-[13px] font-semibold text-bad">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-[1fr_1.15fr] items-start gap-4.5">
        <Card className="flex flex-col items-center px-9 py-11 text-center">
          <div
            className="mb-6.5 text-[12px] font-bold uppercase tracking-[0.16em]"
            style={{ color: phase === "recording" ? "var(--bad)" : "var(--muted)" }}
          >
            {phase === "recording" ? "● Gravando consulta" : phase === "analyzing" ? "Analisando…" : "Pronto para gravar"}
          </div>
          <button
            onClick={phase === "recording" ? stopRecording : phase === "setup" ? startRecording : undefined}
            disabled={phase === "analyzing"}
            className="grid h-[120px] w-[120px] place-items-center rounded-full border-none text-[44px] text-[#fffdfa] transition-transform hover:scale-105 disabled:opacity-70"
            style={{
              background:
                phase === "recording"
                  ? "var(--bad)"
                  : "linear-gradient(150deg, var(--gold), var(--gold2))",
              animation: phase === "recording" ? "pulseRing 1.6s ease-out infinite" : "none",
            }}
          >
            {phase === "recording" ? "■" : "🎙"}
          </button>
          <div className="my-6.5 font-serif text-[44px] font-medium tabular-nums">
            {fmtTime(seconds)}
          </div>
          <div className="text-[12.5px] text-muted">
            {phase === "recording"
              ? "Toque para encerrar — a análise da IA começa na hora"
              : "Toque no microfone ao iniciar a negociação com a cliente"}
          </div>
          {!speechSupported && phase === "setup" && (
            <div className="mt-4 text-[11.5px] text-muted">
              Reconhecimento de voz não suportado neste navegador — use o campo de transcrição manual ao lado.
            </div>
          )}
          {phase === "recording" && (
            <div className="mt-6.5 flex h-11 items-center gap-0.75">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-sm bg-gold"
                  style={{
                    height: 40,
                    animation: "wave 1s ease-in-out infinite",
                    animationDelay: `${(i * 73) % 900}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6.5">
          <div className="mb-1 font-serif text-[21px] font-semibold">
            {phase === "recording" ? "O que falar agora" : "Transcrição da consulta"}
          </div>
          <div className="mb-4.5 text-[12px] text-muted">
            {phase === "recording"
              ? "Sugestões da IA em tempo real durante a negociação"
              : "Capturada automaticamente pelo microfone ou digitada manualmente"}
          </div>

          {phase === "recording" && liveTips.length > 0 && (
            <div className="mb-5 flex flex-col gap-3">
              {liveTips.map((tip, i) => (
                <div key={i} className="rounded-2xl border border-gold bg-goldsoft px-4.5 py-4">
                  <div className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-gold">
                    {tip.tag}
                  </div>
                  <div className="text-[13.5px] font-medium leading-relaxed">{tip.text}</div>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="A transcrição aparece aqui conforme a consulta acontece. Você também pode digitar ou colar o texto manualmente."
            rows={10}
            className="w-full resize-none rounded-xl border border-line bg-bg px-4 py-3 text-[13.5px] leading-relaxed outline-none focus:border-gold"
          />

          {phase === "setup" && (
            <button
              onClick={() => {
                if (!transcript.trim()) {
                  setErrorMsg("Grave ou digite a transcrição da consulta antes de analisar.");
                  return;
                }
                const estimatedSeconds = Math.max(Math.round(transcript.split(/\s+/).length / 2.5), 30);
                setSeconds(estimatedSeconds);
                setPhase("analyzing");
                startFinalize(async () => {
                  try {
                    const result = await finalizeConsultation({
                      patientId,
                      professionalId,
                      rawTranscript: transcript,
                      durationSeconds: estimatedSeconds,
                    });
                    setAnalysis(result.analysis);
                    setConsultationId(result.consultationId);
                    setPhase("done");
                  } catch (e) {
                    setErrorMsg(e instanceof Error ? e.message : "Não foi possível analisar a consulta.");
                    setPhase("setup");
                  }
                });
              }}
              className="mt-4 rounded-[10px] bg-gradient-to-br from-gold to-gold2 px-6 py-3 text-[13.5px] font-bold text-[#fffdfa]"
            >
              Analisar transcrição digitada
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
