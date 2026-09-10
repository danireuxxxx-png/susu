"use server";

import { auth } from "@/auth";
import { recommendAgents } from "@/lib/ai";
import { isAiConfigured } from "@/lib/anthropic";
import { agentById, catalogForPrompt } from "@/lib/agent-search";

export type AiMatch = {
  agentId: string;
  nome: string;
  motivo: string;
  prioridade: "Essencial" | "Complementar";
};

export type AiMatchResult = {
  resumoSolucao: string;
  recomendados: AiMatch[];
  perguntas: string[];
};

export async function matchAgentsWithAi(input: {
  necessidade: string;
  empresa?: string;
}): Promise<AiMatchResult> {
  const session = await auth();
  if (!session?.user) throw new Error("Sessão expirada. Faça login novamente.");

  const necessidade = input.necessidade.trim();
  if (necessidade.length < 15) {
    throw new Error("Descreva a necessidade do cliente com um pouco mais de detalhe.");
  }

  if (!isAiConfigured()) {
    throw new Error(
      "Match com IA indisponível: configure a variável ANTHROPIC_API_KEY. A busca por especificação continua funcionando normalmente."
    );
  }

  const result = await recommendAgents({
    necessidade,
    empresa: input.empresa,
    catalogo: catalogForPrompt(),
  });

  const recomendados = (result.recomendados ?? [])
    .map((r) => {
      const agent = agentById(r.agentId);
      if (!agent) return null;
      return {
        agentId: agent.id,
        nome: agent.nome,
        motivo: r.motivo,
        prioridade: r.prioridade === "Complementar" ? "Complementar" : "Essencial",
      } satisfies AiMatch;
    })
    .filter((r): r is AiMatch => r !== null);

  if (recomendados.length === 0) {
    throw new Error("A IA não encontrou agentes do catálogo para essa necessidade. Tente detalhar mais.");
  }

  return {
    resumoSolucao: result.resumoSolucao ?? "",
    recomendados,
    perguntas: (result.perguntas ?? []).slice(0, 4),
  };
}
