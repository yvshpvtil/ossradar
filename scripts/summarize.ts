/**
 * One-liner generator: "what it does and why it matters".
 *
 * summarize() is the pluggable hook used by scripts/collect.ts. With ANTHROPIC_API_KEY set
 * it asks Claude for a one-sentence summary; otherwise (or on any error/refusal) it falls
 * back to a deterministic template built from the repo description. To use another
 * provider, add a branch in summarize() that returns a string or null.
 */
import { categoryLabel } from "../lib/categories";
import type { CategorySlug } from "../lib/types";

export interface SummaryInput {
  fullName: string;
  description: string;
  topics: string[];
  language: string | null;
  category: CategorySlug;
  stars: number;
  delta7d: number;
}

const MODEL = process.env.SUMMARY_MODEL ?? "claude-opus-5-5";

function clean(text: string): string {
  return text
    .replace(/:[a-z0-9_+-]+:/gi, "") // :emoji: shortcodes
    .replace(/\p{Extended_Pictographic}️?/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : max).replace(/[,;:.\s-]+$/, "")}…`;
}

const WHY: Record<CategorySlug, string> = {
  "ai-agents": "worth a look if you build or run autonomous agents",
  "llm-tooling": "useful plumbing for shipping LLM-powered features",
  mcp: "extends what MCP-compatible assistants can connect to and do",
  "coding-agents": "relevant if AI is part of your coding workflow",
  "rag-vector": "relevant for grounding LLMs in your own data",
  "local-llms": "helps you run models on your own hardware without an API bill",
  devops: "worth a look for your infrastructure and delivery stack",
  other: "a developer project picking up unusual momentum",
};

export function templateSummary(input: SummaryInput): string {
  const desc = clean(input.description);
  let what = desc
    ? truncate(desc, 150)
    : `${input.language ?? "Open-source"} project in ${categoryLabel(input.category)}`;
  if (!/[.!?…。]$/.test(what)) what += ".";
  const why = WHY[input.category];
  return `${what} Why it matters: ${why}.`;
}

let anthropicClient: import("@anthropic-ai/sdk").default | null = null;

async function claudeSummary(input: SummaryInput): Promise<string | null> {
  if (!anthropicClient) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    anthropicClient = new Anthropic();
  }
  const response = await anthropicClient.messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low" },
    system:
      "You write one-line summaries of GitHub repositories for a developer newsletter. Reply with exactly one plain sentence of at most 30 words that says what the project does and why a developer should care. No hype, no emoji, no markdown, no quotes.",
    messages: [
      {
        role: "user",
        content: `Repo: ${input.fullName}\nDescription: ${input.description || "(none)"}\nTopics: ${input.topics.join(", ") || "(none)"}\nLanguage: ${input.language ?? "unknown"}\nCategory: ${categoryLabel(input.category)}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join(" ")
    .trim();
  return text ? truncate(clean(text), 240) : null;
}

export async function summarize(input: SummaryInput): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await claudeSummary(input);
      if (result) return result;
    } catch (err) {
      console.warn(`summarize: LLM failed for ${input.fullName}, using template`, (err as Error).message);
    }
  }
  return templateSummary(input);
}

/** Whether summaries come from an LLM (used to decide if cached one-liners can be reused). */
export const summarizerId = process.env.ANTHROPIC_API_KEY ? `anthropic:${MODEL}` : "template";
