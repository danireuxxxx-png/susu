import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;

export function isAiConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Defina a variável de ambiente para habilitar os recursos de IA."
    );
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const startArr = text.indexOf("[");
  if (start !== -1 && (startArr === -1 || start < startArr) && end !== -1) {
    return text.slice(start, end + 1);
  }
  const endArr = text.lastIndexOf("]");
  if (startArr !== -1 && endArr !== -1) return text.slice(startArr, endArr + 1);
  return text;
}

export async function askForJson<T>(system: string, user: string, maxTokens = 2000): Promise<T> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 0.5,
    system,
    messages: [{ role: "user", content: user }],
  });

  const block = response.content.find((c) => c.type === "text");
  const text = block && block.type === "text" ? block.text : "";
  try {
    return JSON.parse(extractJson(text)) as T;
  } catch {
    throw new Error(`Resposta da IA não pôde ser interpretada como JSON: ${text.slice(0, 300)}`);
  }
}
