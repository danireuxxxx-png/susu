/**
 * Busca por especificação: recebe o que a empresa precisa (texto livre + filtros)
 * e devolve os agentes do catálogo ordenados por aderência, com o motivo de cada
 * um ter aparecido. Roda inteiramente no cliente — sem chamada de API.
 */

import { AGENTS, type Area, type CatalogAgent, type Categoria } from "@/lib/agent-catalog";

export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STOPWORDS = new Set(
  normalize(
    `a o e de da do das dos que com para por em no na nos nas um uma uns umas ao aos pelo pela
     meu minha meus minhas nosso nossa nossos nossas eu voce voces nao sim mas ou ja mais menos
     muito muita muitos muitas tem ter tenho temos preciso precisa precisamos quero queremos quer
     gostaria gostariamos fazer faz fazem como quando onde qual quais isso isto esse essa este esta
     seu sua seus suas sao ser esta estao estamos pra pro la aqui todo toda todos todas cada mesmo
     ainda so apenas bem melhor pior sobre entre sem ate desde depois antes agora hoje ha
     empresa empresas negocio negocios cliente clientes coisa coisas gente pessoal algum alguma
     alguns algumas nada tudo ainda porque pois entao assim ficar fica ficam dar da dao ir vai vao
     agente agentes ia inteligencia artificial solucao solucoes ajuda ajudar melhorar
     saber reduzir aumentar evitar garantir montar conseguir precisar rapido rapida forma`
  ).split(" ")
);

/** Grupos de sinônimos: uma palavra da consulta puxa as demais do grupo com peso reduzido. */
const SYNONYM_GROUPS: string[][] = [
  ["whatsapp", "zap", "whats", "chat", "mensagem", "mensagens", "conversa"],
  ["lead", "leads", "prospect", "prospects", "contato", "contatos", "oportunidade", "oportunidades"],
  [
    "anuncio",
    "anuncios",
    "ads",
    "trafego",
    "midia",
    "campanha",
    "campanhas",
    "publicidade",
    "meta",
    "facebook",
    "instagram",
  ],
  ["verba", "orcamento", "budget", "investimento", "gasto", "gastos", "custo", "custos"],
  ["venda", "vendas", "vender", "comercial", "faturamento", "receita", "fechamento"],
  ["churn", "cancelamento", "cancelamentos", "retencao", "evasao", "fidelizacao", "ltv"],
  [
    "curriculo",
    "curriculos",
    "cv",
    "candidato",
    "candidatos",
    "recrutamento",
    "selecao",
    "contratacao",
    "vaga",
    "vagas",
    "rh",
    "talento",
  ],
  ["nota", "fiscal", "despesa", "despesas", "reembolso", "recibo", "comprovante"],
  ["proposta", "propostas", "contrato", "contratos", "documento", "documentos", "pdf", "assinatura"],
  ["financeiro", "dre", "contabil", "caixa", "lucro", "margem", "fatura", "faturas"],
  ["concorrente", "concorrentes", "concorrencia", "rival", "rivais", "mercado", "benchmark"],
  ["atendimento", "suporte", "sac", "helpdesk", "chamado", "chamados", "ticket", "atendente"],
  ["conteudo", "post", "posts", "social", "redes", "copy", "texto", "criativo", "criativos"],
  [
    "relatorio",
    "relatorios",
    "dashboard",
    "painel",
    "indicador",
    "indicadores",
    "kpi",
    "metrica",
    "metricas",
    "dados",
  ],
  ["agendamento", "agenda", "reuniao", "reunioes", "calendario", "horario", "horarios"],
  ["follow", "followup", "acompanhamento", "cobranca", "retomada", "reengajamento"],
  ["seo", "organico", "busca", "google", "keyword", "ranqueamento", "site"],
  ["ocr", "digitalizacao", "digitacao", "escaneamento", "extracao", "papel"],
  ["lgpd", "privacidade", "seguranca", "vazamento", "compliance", "conformidade", "auditoria"],
  ["prospeccao", "outbound", "cold", "abordagem", "sdr", "captacao", "b2b"],
  ["onboarding", "implantacao", "ativacao", "posvenda"],
  ["preco", "precos", "precificacao", "desconto", "descontos", "tabela", "valores"],
  [
    "equipe",
    "time",
    "colaborador",
    "colaboradores",
    "funcionario",
    "funcionarios",
    "clima",
    "turnover",
  ],
  ["reputacao", "avaliacao", "avaliacoes", "review", "reviews", "reclamacao", "reclamacoes", "nps"],
  ["monitorar", "monitoramento", "alerta", "alertas", "aviso", "acompanhar", "vigiar"],
  ["automacao", "automatizar", "automatico", "robo", "escalar", "manual"],
];

/** Expressões de duas palavras que apontam para termos do catálogo. */
const PHRASE_HINTS: [string, string[]][] = [
  ["carrinho abandonado", ["reativacao", "carrinho"]],
  ["base inativa", ["reativacao", "base"]],
  ["base parada", ["reativacao", "base"]],
  ["hora extra", ["ponto", "trabalhista"]],
  ["nota fiscal", ["fiscal", "despesa"]],
  ["trafego pago", ["anuncio", "roas", "midia"]],
  ["tempo de resposta", ["sla", "atendimento", "whatsapp"]],
  ["demora para responder", ["sla", "atendimento"]],
  ["fora do ar", ["uptime", "api", "instabilidade"]],
  ["teste ab", ["copy", "criativo"]],
  ["ticket medio", ["ticket", "cross", "sell"]],
  ["fechamento de mes", ["dre", "financeiro"]],
  ["primeiro atendimento", ["sdr", "qualificacao"]],
];

function stem(word: string) {
  if (word.length >= 6 && word.endsWith("coes")) return `${word.slice(0, -4)}cao`;
  if (word.length >= 6 && word.endsWith("oes")) return `${word.slice(0, -3)}ao`;
  if (word.length >= 6 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length >= 5 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function tokenize(text: string) {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

const SYNONYM_INDEX = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    const key = stem(word);
    const others = group.filter((w) => stem(w) !== key).map(stem);
    SYNONYM_INDEX.set(key, [...(SYNONYM_INDEX.get(key) ?? []), ...others]);
  }
}

type FieldKey = "nome" | "palavra-chave" | "dor" | "resumo" | "classificação" | "descrição";

const FIELD_WEIGHTS: Record<FieldKey, number> = {
  nome: 6,
  "palavra-chave": 5,
  dor: 4.5,
  resumo: 3,
  classificação: 3,
  descrição: 1.6,
};

type IndexedAgent = { agent: CatalogAgent; fields: Record<FieldKey, Set<string>> };

function indexField(...parts: (string | null)[]) {
  return new Set(tokenize(parts.filter(Boolean).join(" ")).map(stem));
}

const INDEX: IndexedAgent[] = AGENTS.map((agent) => ({
  agent,
  fields: {
    nome: indexField(agent.nome),
    "palavra-chave": indexField(agent.palavrasChave.join(" ")),
    dor: indexField(agent.dores.join(" ")),
    resumo: indexField(agent.resumo),
    classificação: indexField(
      [agent.categoria, ...agent.areas, ...agent.entregas, ...agent.integracoes].join(" ")
    ),
    descrição: indexField(agent.oQueFaz, agent.comoFunciona, agent.objetivo),
  },
}));

const FIELD_ORDER: FieldKey[] = [
  "nome",
  "palavra-chave",
  "dor",
  "resumo",
  "classificação",
  "descrição",
];

export type MatchReason = { termo: string; campo: FieldKey };

export type AgentMatch = {
  agent: CatalogAgent;
  score: number;
  /** Aderência relativa ao melhor resultado da busca, de 0 a 100. */
  aderencia: number;
  reasons: MatchReason[];
};

export type SearchInput = {
  query?: string;
  areas?: Area[];
  categorias?: Categoria[];
};

type Concept = { termo: string; stem: string; peso: number };

function conceptsFromQuery(query: string): Concept[] {
  const normalized = normalize(query);
  const concepts = new Map<string, Concept>();

  const add = (termo: string, raw: string, peso: number) => {
    const key = stem(raw);
    const existing = concepts.get(key);
    if (!existing || existing.peso < peso) concepts.set(key, { termo, stem: key, peso });
  };

  for (const token of tokenize(query)) add(token, token, 1);

  for (const [phrase, hints] of PHRASE_HINTS) {
    if (!normalized.includes(phrase)) continue;
    for (const hint of hints) add(phrase, hint, 0.9);
  }

  for (const concept of [...concepts.values()]) {
    if (concept.peso < 1) continue;
    for (const synonym of SYNONYM_INDEX.get(concept.stem) ?? []) {
      add(concept.termo, synonym, 0.55);
    }
  }

  return [...concepts.values()];
}

export function searchAgents({ query = "", areas = [], categorias = [] }: SearchInput): AgentMatch[] {
  const concepts = conceptsFromQuery(query);

  const filtered = INDEX.filter(({ agent }) => {
    const areaOk = areas.length === 0 || agent.areas.some((a) => areas.includes(a));
    const catOk = categorias.length === 0 || categorias.includes(agent.categoria);
    return areaOk && catOk;
  });

  if (concepts.length === 0) {
    return filtered.map(({ agent }) => ({ agent, score: 0, aderencia: 0, reasons: [] }));
  }

  const scored = filtered.map(({ agent, fields }) => {
    let score = 0;
    const reasons = new Map<string, MatchReason>();

    for (const concept of concepts) {
      let best: { peso: number; campo: FieldKey } | null = null;
      let hits = 0;

      for (const campo of FIELD_ORDER) {
        if (!fields[campo].has(concept.stem)) continue;
        hits += 1;
        const peso = FIELD_WEIGHTS[campo] * concept.peso;
        if (!best || peso > best.peso) best = { peso, campo };
      }

      if (!best) continue;
      // campo principal + bônus pequeno por reforço em outros campos
      score += best.peso + (hits - 1) * 0.4;
      if (concept.peso >= 1 && !reasons.has(concept.termo)) {
        reasons.set(concept.termo, { termo: concept.termo, campo: best.campo });
      }
    }

    return { agent, score, reasons: [...reasons.values()] };
  });

  const matched = scored.filter((m) => m.score > 0).sort((a, b) => b.score - a.score);
  const best = matched[0]?.score ?? 1;

  return matched.map((m) => ({
    ...m,
    aderencia: Math.max(12, Math.round((m.score / best) * 100)),
  }));
}

/** Lista compacta usada como contexto para o match com IA. */
export function catalogForPrompt() {
  return AGENTS.map(
    (a) => `${a.id} | ${a.nome} | ${a.categoria} | ${a.areas.join(", ")} | ${a.resumo}`
  ).join("\n");
}

export function agentById(id: string) {
  return AGENTS.find((a) => a.id === id) ?? null;
}

export function buildProposalText(input: {
  empresa: string;
  necessidade: string;
  agents: CatalogAgent[];
}) {
  const header = input.empresa.trim()
    ? `Escopo de agentes de IA — ${input.empresa.trim()}`
    : "Escopo de agentes de IA";

  const linhas = [
    header,
    "=".repeat(header.length),
    "",
    input.necessidade.trim() ? `Necessidade levantada: ${input.necessidade.trim()}` : "",
    input.necessidade.trim() ? "" : "",
    `Agentes propostos (${input.agents.length}):`,
    "",
  ].filter((l, i, arr) => !(l === "" && arr[i - 1] === ""));

  input.agents.forEach((a, i) => {
    linhas.push(`${i + 1}. ${a.nome} — ${a.categoria}`);
    linhas.push(`   O que faz: ${a.oQueFaz}`);
    if (a.comoFunciona) linhas.push(`   Como funciona: ${a.comoFunciona}`);
    linhas.push(`   Resultado esperado: ${a.objetivo}`);
    if (a.integracoes.length) linhas.push(`   Integrações: ${a.integracoes.join(", ")}`);
    linhas.push("");
  });

  return linhas.join("\n").trim();
}
