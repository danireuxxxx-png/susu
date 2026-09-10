import "server-only";
import { askForJson } from "@/lib/anthropic";

const SYSTEM_BASE =
  "Você é a copilota de IA de uma clínica de estética avançada chamada Élan, especializada em analisar consultas de vendas de tratamentos estéticos. " +
  "Responda sempre em português do Brasil, em tom profissional e direto. Responda APENAS com um objeto JSON válido, sem markdown, sem comentários, sem texto fora do JSON.";

export type LiveTip = { tag: string; text: string };

export async function generateLiveTips(input: {
  transcriptSoFar: string;
  patientName: string;
  professionalName: string;
  treatmentHint?: string | null;
}): Promise<{ tips: LiveTip[] }> {
  const system =
    SYSTEM_BASE +
    " Você está ouvindo uma consulta em andamento entre uma profissional e uma paciente e deve sugerir, em tempo real, o que a profissional pode dizer a seguir para construir valor e conduzir ao fechamento, com base apenas no que já foi dito.";

  const user = `Paciente: ${input.patientName}
Profissional: ${input.professionalName}
Tratamento de interesse (se conhecido): ${input.treatmentHint ?? "não informado"}

Transcrição parcial captada até agora (pode ter erros de reconhecimento de voz e não distingue quem fala):
"""
${input.transcriptSoFar || "(ainda sem fala capturada)"}
"""

Gere exatamente 3 sugestões curtas e acionáveis para a profissional usar AGORA na conversa, cada uma com uma etiqueta curta (ex: "Construção de valor", "Evite agora", "Fechamento", "Escuta ativa", "Investigação").

Formato de resposta (JSON estrito):
{"tips": [{"tag": "string", "text": "string"}, {"tag": "string", "text": "string"}, {"tag": "string", "text": "string"}]}`;

  return askForJson(system, user, 800);
}

export type SubScore = { label: string; grade: number };
export type TranscriptSegment = {
  speaker: "Profissional" | "Paciente";
  text: string;
  mark: "good" | "bad" | null;
  note: string | null;
};

export type ConsultationAnalysis = {
  score: number;
  summary: string;
  subScores: SubScore[];
  transcript: TranscriptSegment[];
  couldSay: string[];
  avoidSay: string[];
  speakingBalancePro: number;
  treatmentSuggested: string;
  facts: {
    objections: string;
    finalSentiment: string;
    longSilences: string;
    referredClinic: string;
  };
};

export async function generateConsultationAnalysis(input: {
  rawTranscript: string;
  patientName: string;
  patientNotes?: string | null;
  professionalName: string;
  durationSeconds: number;
}): Promise<ConsultationAnalysis> {
  const system =
    SYSTEM_BASE +
    " Você recebe a transcrição bruta de uma consulta (captada por um único microfone, sem separação de falantes) e deve reconstruir a conversa por turnos, avaliar a técnica de venda da profissional e dar recomendações de coaching.";

  const user = `Paciente: ${input.patientName}
Observações clínicas da paciente: ${input.patientNotes ?? "nenhuma"}
Profissional: ${input.professionalName}
Duração da consulta: ${Math.round(input.durationSeconds / 60)} minutos

Transcrição bruta capturada (pode ter erros de reconhecimento de voz, sem marcação de quem fala):
"""
${input.rawTranscript}
"""

Tarefas:
1. Reconstrua a conversa em turnos alternando "Profissional" e "Paciente" da forma mais plausível, dividindo o texto em segmentos de fala.
2. Marque os melhores momentos da profissional com mark="good" e os deslizes (jargão técnico não traduzido, desconto oferecido sem pedido, etc.) com mark="bad", com uma nota curta explicando por quê. Segmentos neutros usam mark=null e note=null.
3. Dê uma nota geral de 0 a 10 (uma casa decimal) para a consulta.
4. Dê notas de 0 a 10 para 5 competências: "Escuta ativa", "Construção de valor", "Clareza de linguagem", "Negociação", "Fechamento".
5. Escreva um resumo de 2-4 frases sobre a consulta.
6. Liste 3 frases que a profissional poderia ter dito e não disse ("couldSay").
7. Liste 3 coisas que ela disse e não precisava ("avoidSay").
8. Estime o percentual de tempo de fala da profissional (0-100, "speakingBalancePro").
9. Identifique o tratamento principal discutido ("treatmentSuggested").
10. Preencha "facts" com leituras qualitativas curtas: objeções levantadas, sentimento final da paciente, se houve silêncios longos após alguma fala, e se a paciente indicou/mencionou indicar a clínica.

Formato de resposta (JSON estrito, sem texto fora do objeto):
{
  "score": 8.7,
  "summary": "string",
  "subScores": [{"label": "Escuta ativa", "grade": 9.0}, {"label": "Construção de valor", "grade": 9.0}, {"label": "Clareza de linguagem", "grade": 7.0}, {"label": "Negociação", "grade": 7.5}, {"label": "Fechamento", "grade": 9.5}],
  "transcript": [{"speaker": "Profissional", "text": "string", "mark": "good", "note": "string"}],
  "couldSay": ["string", "string", "string"],
  "avoidSay": ["string", "string", "string"],
  "speakingBalancePro": 58,
  "treatmentSuggested": "string",
  "facts": {"objections": "string", "finalSentiment": "string", "longSilences": "string", "referredClinic": "string"}
}`;

  return askForJson(system, user, 4000);
}

export async function generateProfessionalInsight(input: {
  professionalName: string;
  analyses: { summary: string; couldSay: string[]; avoidSay: string[]; score: number }[];
}): Promise<{ strengths: string; weaknesses: string }> {
  const system =
    SYSTEM_BASE +
    " Você resume o estilo de venda de uma profissional a partir do histórico de análises de consultas dela, destacando pontos fortes e pontos a desenvolver.";

  const analysesText = input.analyses
    .map(
      (a, i) =>
        `Consulta ${i + 1} (nota ${a.score}): ${a.summary}\nPoderia dizer: ${a.couldSay.join("; ")}\nEvitar: ${a.avoidSay.join("; ")}`
    )
    .join("\n\n");

  const user = `Profissional: ${input.professionalName}

Histórico de análises de consultas recentes:
"""
${analysesText || "sem consultas analisadas ainda"}
"""

Escreva um parágrafo curto (2-3 frases) de pontos fortes e outro de pontos a desenvolver, em tom construtivo, direcionado à diretora da clínica.

Formato de resposta (JSON estrito):
{"strengths": "string", "weaknesses": "string"}`;

  return askForJson(system, user, 600);
}

export async function generatePatientTip(input: {
  patientName: string;
  age: number;
  status: string;
  currentTreatment?: string | null;
  history: string[];
  notes?: string | null;
  ltv: number;
  satisfaction: number | null;
}): Promise<{ tip: string }> {
  const system =
    SYSTEM_BASE +
    " Você sugere uma abordagem comercial personalizada para a próxima interação com uma paciente da clínica, com base no perfil e histórico dela.";

  const user = `Paciente: ${input.patientName}, ${input.age} anos, status: ${input.status}
Tratamento atual: ${input.currentTreatment ?? "nenhum"}
Já realizou: ${input.history.join(", ") || "nenhum tratamento ainda"}
Observações clínicas: ${input.notes ?? "nenhuma"}
Total investido na clínica: R$ ${input.ltv}
Satisfação média: ${input.satisfaction ?? "sem dados"}

Escreva uma sugestão curta (2-3 frases) de como a equipe deve abordar essa paciente na próxima interação, focada em aumentar retenção e valor percebido.

Formato de resposta (JSON estrito):
{"tip": "string"}`;

  return askForJson(system, user, 400);
}

const SYSTEM_CATALOGO =
  "Você é a consultora de pré-venda de uma empresa que implanta agentes de IA sob medida para outras empresas. " +
  "Você conhece apenas os agentes do catálogo enviado e recomenda somente agentes que existem nele, usando exatamente o id informado. " +
  "Responda sempre em português do Brasil, em tom consultivo e direto, pronto para ser usado numa reunião de vendas. " +
  "Responda APENAS com um objeto JSON válido, sem markdown, sem comentários, sem texto fora do JSON.";

export type AgentRecommendation = {
  agentId: string;
  motivo: string;
  prioridade: "Essencial" | "Complementar";
};

export type AgentMatchResult = {
  resumoSolucao: string;
  recomendados: AgentRecommendation[];
  perguntas: string[];
};

export async function recommendAgents(input: {
  necessidade: string;
  empresa?: string | null;
  catalogo: string;
}): Promise<AgentMatchResult> {
  const user = `Catálogo disponível (formato: id | nome | categoria | áreas | resumo):
"""
${input.catalogo}
"""

Empresa/cliente: ${input.empresa?.trim() || "não informado"}
Necessidade descrita pelo vendedor:
"""
${input.necessidade}
"""

Selecione de 3 a 6 agentes do catálogo que resolvem essa necessidade, do mais importante para o menos importante.
Use apenas ids que aparecem no catálogo acima. Para cada um, escreva em uma frase por que ele entra nessa solução, conectando com a dor descrita.
Escreva também um resumo de 2 a 3 frases de como esses agentes funcionam juntos como uma solução (para o vendedor usar na reunião)
e de 2 a 4 perguntas de diagnóstico que o vendedor ainda precisa fazer para fechar o escopo.

Formato de resposta (JSON estrito):
{"resumoSolucao": "string", "recomendados": [{"agentId": "string", "motivo": "string", "prioridade": "Essencial" | "Complementar"}], "perguntas": ["string"]}`;

  return askForJson(SYSTEM_CATALOGO, user, 1600);
}
