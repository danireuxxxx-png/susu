"use client";

import { useMemo, useState, useTransition } from "react";
import { AREAS, CATEGORIAS, type Area, type Categoria } from "@/lib/agent-catalog";
import { agentById, buildProposalText, searchAgents, type AgentMatch } from "@/lib/agent-search";
import { cn } from "@/lib/utils";
import { matchAgentsWithAi, type AiMatchResult } from "./actions";

const EXEMPLOS = [
  "Chegam muitos leads pelo WhatsApp e o time demora horas para responder",
  "Gasto alto com anúncios e sem clareza de retorno por campanha",
  "Propostas e contratos são montados na mão e demoram dias para sair",
  "Clientes cancelando e ninguém percebe antes do pedido de saída",
  "Financeiro só em planilha: DRE, notas fiscais e reembolsos manuais",
  "Preciso acompanhar preços e ofertas dos concorrentes",
  "RH afogado em currículos e vagas técnicas paradas",
  "Nenhum follow-up de proposta acontece sem eu cobrar",
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors",
        active
          ? "border-gold bg-goldsoft text-gold"
          : "border-line text-muted hover:border-gold hover:text-gold"
      )}
    >
      {children}
    </button>
  );
}

function AgentCard({
  match,
  selected,
  onToggle,
  aiMotivo,
  showAderencia,
}: {
  match: AgentMatch;
  selected: boolean;
  onToggle: () => void;
  aiMotivo?: string;
  showAderencia: boolean;
}) {
  const { agent } = match;

  return (
    <div
      className="rounded-2xl border bg-card p-5 shadow-[var(--shadow)] transition-colors"
      style={{
        borderColor: selected ? "var(--gold)" : "var(--line)",
        background: selected ? "var(--goldsoft)" : "var(--card)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-card2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">
              {agent.categoria}
            </span>
            {agent.areas.map((a) => (
              <span key={a} className="text-[11px] font-semibold text-muted">
                · {a}
              </span>
            ))}
          </div>
          <h3 className="mt-2 font-serif text-[21px] font-semibold leading-tight text-ink">
            {agent.nome}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{agent.resumo}</p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          className={cn(
            "flex-none rounded-full border px-3.5 py-2 text-[11.5px] font-bold transition-colors",
            selected
              ? "border-gold bg-gold text-card"
              : "border-line text-muted hover:border-gold hover:text-gold"
          )}
        >
          {selected ? "✓ na proposta" : "+ proposta"}
        </button>
      </div>

      {showAderencia && (
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-card2">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${match.aderencia}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-gold">{match.aderencia}% de aderência</span>
        </div>
      )}

      {match.reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {match.reasons.map((r) => (
            <span
              key={r.termo + r.campo}
              className="rounded-full border border-line px-2.5 py-1 text-[10.5px] font-semibold text-muted"
            >
              {r.termo} <span className="opacity-60">· {r.campo}</span>
            </span>
          ))}
        </div>
      )}

      {aiMotivo && (
        <div className="mt-3 rounded-xl bg-goldsoft px-3.5 py-3">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold">
            Por que a IA indicou
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed">{aiMotivo}</p>
        </div>
      )}

      <details className="group mt-4">
        <summary className="cursor-pointer list-none text-[11.5px] font-bold text-gold underline decoration-dotted">
          <span className="group-open:hidden">ver especificação completa</span>
          <span className="hidden group-open:inline">esconder especificação</span>
        </summary>

        <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3.5">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
              O que faz
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed">{agent.oQueFaz}</p>
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Como funciona
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed">
              {agent.comoFunciona ?? "Não detalhado no catálogo de origem."}
            </p>
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Resultado esperado
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed">{agent.objetivo}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
                Entregas
              </div>
              <p className="mt-1 text-[12.5px]">{agent.entregas.join(" · ")}</p>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
                Integrações
              </div>
              <p className="mt-1 text-[12.5px]">{agent.integracoes.join(" · ")}</p>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Dores que resolve
            </div>
            <p className="mt-1 text-[12.5px]">{agent.dores.join(" · ")}</p>
          </div>
          <div className="text-[10.5px] text-muted">Fonte: {agent.fontes.join(" · ")}</div>
        </div>
      </details>
    </div>
  );
}

export function CatalogExplorer() {
  const [empresa, setEmpresa] = useState("");
  const [necessidade, setNecessidade] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [aiResult, setAiResult] = useState<AiMatchResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pending, startTransition] = useTransition();

  const temBusca = necessidade.trim().length > 2;

  const matches = useMemo(() => {
    const all = searchAgents({ query: necessidade, areas, categorias });
    if (!temBusca) return all;
    const fortes = all.filter((m) => m.aderencia >= 25);
    return fortes.length >= 4 ? fortes : all.slice(0, 6);
  }, [necessidade, areas, categorias, temBusca]);

  const visiveis = mostrarTodos ? matches : matches.slice(0, 15);
  const motivosIa = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of aiResult?.recomendados ?? []) map.set(r.agentId, r.motivo);
    return map;
  }, [aiResult]);

  const agentesSelecionados = selected
    .map((id) => agentById(id))
    .filter((a): a is NonNullable<ReturnType<typeof agentById>> => a !== null);

  function toggleSelecionado(id: string) {
    setCopiado(false);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleArea(area: Area) {
    setAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  function toggleCategoria(cat: Categoria) {
    setCategorias((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function limparBusca() {
    setNecessidade("");
    setAreas([]);
    setCategorias([]);
    setAiResult(null);
    setAiError(null);
    setMostrarTodos(false);
  }

  function rodarMatchIa() {
    setAiError(null);
    startTransition(async () => {
      try {
        const result = await matchAgentsWithAi({ necessidade, empresa });
        setAiResult(result);
      } catch (e) {
        setAiResult(null);
        setAiError(e instanceof Error ? e.message : "Não foi possível consultar a IA agora.");
      }
    });
  }

  async function copiarEscopo() {
    const texto = buildProposalText({ empresa, necessidade, agents: agentesSelecionados });
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
      setAiError("Não foi possível copiar automaticamente. Selecione o texto do escopo manualmente.");
    }
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4 xl:sticky xl:top-6">
        <div className="rounded-2xl border border-line bg-card p-6 shadow-[var(--shadow)]">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold">
            Especificação do cliente
          </div>

          <label className="mt-4 block text-[11.5px] font-bold text-muted" htmlFor="empresa">
            Empresa / cliente
          </label>
          <input
            id="empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Ex.: Odontologia Prime"
            className="mt-1.5 w-full rounded-xl border border-line bg-card2 px-3.5 py-2.5 text-[13px] outline-none focus:border-gold"
          />

          <label className="mt-4 block text-[11.5px] font-bold text-muted" htmlFor="necessidade">
            O que essa empresa precisa resolver?
          </label>
          <textarea
            id="necessidade"
            value={necessidade}
            onChange={(e) => {
              setNecessidade(e.target.value);
              setMostrarTodos(false);
            }}
            rows={5}
            placeholder="Descreva a dor, o processo manual ou a meta. Ex.: perdemos lead porque ninguém responde o WhatsApp rápido e o vendedor não faz follow-up de proposta."
            className="mt-1.5 w-full resize-y rounded-xl border border-line bg-card2 px-3.5 py-3 text-[13px] leading-relaxed outline-none focus:border-gold"
          />

          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXEMPLOS.map((ex) => (
              <Chip
                key={ex}
                active={necessidade === ex}
                onClick={() => {
                  setNecessidade(ex);
                  setMostrarTodos(false);
                }}
              >
                {ex.length > 42 ? `${ex.slice(0, 42)}…` : ex}
              </Chip>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={rodarMatchIa}
              disabled={pending}
              className="flex-1 rounded-full bg-gold px-4 py-3 text-[12.5px] font-bold text-card transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Analisando…" : "✦ Montar solução com IA"}
            </button>
            <button
              type="button"
              onClick={limparBusca}
              className="rounded-full border border-line px-4 py-3 text-[12.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
            >
              Limpar
            </button>
          </div>

          {aiError && (
            <div className="mt-3 rounded-xl border border-bad bg-badbg px-3.5 py-3 text-[12px] leading-relaxed text-bad">
              {aiError}
            </div>
          )}
        </div>

        {agentesSelecionados.length > 0 && (
          <div className="rounded-2xl border border-gold bg-card p-6 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold">
                Proposta em montagem
              </div>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-[11px] font-semibold text-muted underline decoration-dotted hover:text-bad"
              >
                limpar
              </button>
            </div>

            <ol className="mt-3 flex flex-col gap-1.5">
              {agentesSelecionados.map((a, i) => (
                <li key={a.id} className="flex items-start gap-2 text-[12.5px]">
                  <span className="font-bold text-gold">{i + 1}.</span>
                  <span className="min-w-0 flex-1">{a.nome}</span>
                  <button
                    type="button"
                    onClick={() => toggleSelecionado(a.id)}
                    aria-label={`Remover ${a.nome} da proposta`}
                    className="flex-none text-muted hover:text-bad"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={copiarEscopo}
              className="mt-4 w-full rounded-full border border-gold px-4 py-2.5 text-[12.5px] font-bold text-gold transition-colors hover:bg-goldsoft"
            >
              {copiado ? "✓ escopo copiado" : "Copiar escopo para a proposta"}
            </button>
          </div>
        )}
        <div className="rounded-2xl border border-line bg-card p-6 shadow-[var(--shadow)]">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold">
            Filtrar por área
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {AREAS.map((a) => (
              <Chip key={a} active={areas.includes(a)} onClick={() => toggleArea(a)}>
                {a}
              </Chip>
            ))}
          </div>

          <div className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold">
            Filtrar por tipo de agente
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CATEGORIAS.map((c) => (
              <Chip key={c} active={categorias.includes(c)} onClick={() => toggleCategoria(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-4">
        {aiResult && (
          <div className="rounded-2xl border border-gold bg-card p-6 shadow-[var(--shadow)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold">
                Solução sugerida pela IA
              </div>
              <button
                type="button"
                onClick={() =>
                  setSelected((prev) => [
                    ...prev,
                    ...aiResult.recomendados
                      .map((r) => r.agentId)
                      .filter((id) => !prev.includes(id)),
                  ])
                }
                className="rounded-full border border-line px-3.5 py-1.5 text-[11.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
              >
                + adicionar todos à proposta
              </button>
            </div>

            <p className="mt-3 text-[13.5px] leading-relaxed">{aiResult.resumoSolucao}</p>

            <div className="mt-4 flex flex-col gap-2">
              {aiResult.recomendados.map((r, i) => (
                <div key={r.agentId} className="flex items-start gap-3 rounded-xl bg-card2 px-4 py-3">
                  <span className="font-serif text-[18px] font-semibold text-gold">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold">
                      {r.nome}
                      <span className="ml-2 rounded-full bg-goldsoft px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-gold">
                        {r.prioridade}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{r.motivo}</p>
                  </div>
                </div>
              ))}
            </div>

            {aiResult.perguntas.length > 0 && (
              <div className="mt-4 rounded-xl bg-goldsoft px-4 py-3.5">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold">
                  Perguntas para fechar o escopo
                </div>
                <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4 text-[12.5px] leading-relaxed">
                  {aiResult.perguntas.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="text-[12.5px] font-semibold text-muted">
            {matches.length === 0
              ? "Nenhum agente encontrado com essa especificação"
              : temBusca
                ? `${matches.length} agentes aderentes à especificação`
                : `${matches.length} agentes no catálogo`}
          </div>
          {matches.length > visiveis.length && (
            <button
              type="button"
              onClick={() => setMostrarTodos(true)}
              className="text-[12px] font-bold text-gold underline decoration-dotted"
            >
              mostrar todos
            </button>
          )}
        </div>

        {matches.length === 0 && (
          <div className="rounded-2xl border border-line bg-card p-8 text-center shadow-[var(--shadow)]">
            <div className="font-serif text-[22px] text-ink">Nada encontrado com esses termos</div>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-muted">
              Tente descrever a dor do cliente com outras palavras (ex.: “demora no atendimento”,
              “verba de anúncio”, “contrato manual”) ou remova os filtros de área e tipo.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {visiveis.map((m) => (
            <AgentCard
              key={m.agent.id}
              match={m}
              selected={selected.includes(m.agent.id)}
              onToggle={() => toggleSelecionado(m.agent.id)}
              aiMotivo={motivosIa.get(m.agent.id)}
              showAderencia={temBusca}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
