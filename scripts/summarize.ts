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

/* ------------------------------------------------------------------------------------------
 * Repo details enrichment: README → structured "who it's for / use cases / install command".
 * Used by scripts/enrich.ts. Extractors, in order of preference:
 *   1. Anthropic API (ANTHROPIC_API_KEY set)
 *   2. Claude Code CLI (DETAILS_EXTRACTOR=claude-cli, for local backfills)
 *   3. Heuristic README parser (always available, never invents values)
 * Unknown values are null.
 * ---------------------------------------------------------------------------------------- */
import type { RepoDetails } from "../lib/types";

// Bumping this would re-process every repo; v1 files (which also carry legacy requirements) stay valid.
export const DETAILS_VERSION = 1;

function stripMd(readme: string): string {
  return readme
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

/** Deterministic README parser: only reports what the README literally states. */
export function heuristicDetails(readme: string, description: string): Omit<RepoDetails, "fullName" | "extractor" | "generatedAt" | "version" | "readmeHash"> {
  const code = [...readme.matchAll(/```[a-z]*\n([\s\S]*?)```/gi)].flatMap((m) => m[1].split("\n"));
  const install = code
    .map((l) => l.replace(/^\s*\$\s*/, "").trim())
    .find((l) => /^(pip3? install|uv (pip|tool) install|pipx install|npm (i|install)|npx |pnpm (add|dlx)|yarn (add|dlx)|bun (add|x)|brew install|cargo install|go install|docker (run|pull)|curl .*\| *(ba)?sh)/.test(l));

  const feats: string[] = [];
  const featBlock = readme.match(/^#{1,4}\s*(?:✨\s*)?(?:key\s+)?(?:features|use cases|what (?:it|you can) do)[^\n]*\n([\s\S]*?)(?=\n#{1,4}\s)/im);
  if (featBlock) {
    for (const line of featBlock[1].split("\n")) {
      const m = line.match(/^\s*[-*]\s+(.+)/);
      if (m) feats.push(clean(stripMd(m[1]).replace(/\*\*/g, "")).slice(0, 140));
      if (feats.length === 3) break;
    }
  }

  return {
    whoItsFor: null,
    useCases: feats,
    installCommand: install ?? null,
    source: readme.trim() ? "readme" : description ? "inferred" : "readme",
  };
}

const EXTRACT_PROMPT = `You extract structured facts from a GitHub README for a developer directory.
Return ONLY a JSON object, no prose, with exactly these keys:
{"whoItsFor": string (1-2 sentences, who should use this),
 "useCases": [3 short strings],
 "installCommand": string|null (one shell command copied verbatim from the README),
 "source": "readme" | "inferred"}
Rules: installCommand must be copied from the README or null; never invent it.
whoItsFor and useCases may be inferred from the README's description; set source to "inferred" if the README barely describes the project.`;

function parseJsonObject(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

function normalize(raw: Record<string, unknown>, fallback: ReturnType<typeof heuristicDetails>): ReturnType<typeof heuristicDetails> {
  const s = (v: unknown) => (typeof v === "string" && v.trim() && !/^(unknown|n\/a|none|not stated)/i.test(v.trim()) ? v.trim().slice(0, 200) : null);
  return {
    whoItsFor: typeof raw.whoItsFor === "string" && raw.whoItsFor.trim() ? raw.whoItsFor.trim().slice(0, 420) : null,
    useCases: Array.isArray(raw.useCases) ? raw.useCases.filter((u): u is string => typeof u === "string").slice(0, 3).map((u) => u.slice(0, 160)) : fallback.useCases,
    installCommand: s(raw.installCommand) ?? fallback.installCommand,
    source: raw.source === "inferred" ? "inferred" : "readme",
  };
}

async function llmExtract(prompt: string): Promise<string | null> {
  if (process.env.ANTHROPIC_API_KEY) {
    if (!anthropicClient) {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      anthropicClient = new Anthropic();
    }
    const res = await anthropicClient.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low" },
      system: EXTRACT_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    if (res.stop_reason === "refusal") return null;
    return res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  }
  if (process.env.DETAILS_EXTRACTOR === "claude-cli") {
    const { spawn } = await import("node:child_process");
    const bin = process.env.CLAUDE_BIN ?? "claude";
    const stdout = await new Promise<string>((resolve, reject) => {
      const p = spawn(bin, ["-p", "--model", process.env.CLAUDE_MODEL ?? "haiku", "--output-format", "json", "--tools", ""]);
      let out = "";
      let err = "";
      const timer = setTimeout(() => p.kill("SIGKILL"), 180_000);
      p.stdout.on("data", (c) => (out += c));
      p.stderr.on("data", (c) => (err += c));
      p.on("error", reject);
      p.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve(out);
        else reject(new Error(err.slice(0, 200) || `claude exited ${code}`));
      });
      p.stdin.end(`${EXTRACT_PROMPT}\n\n${prompt}`);
    });
    return (JSON.parse(stdout) as { result?: string }).result ?? null;
  }
  return null;
}

export const detailsExtractorId = process.env.ANTHROPIC_API_KEY
  ? `anthropic:${MODEL}`
  : process.env.DETAILS_EXTRACTOR === "claude-cli"
    ? `claude-cli:${process.env.CLAUDE_MODEL ?? "haiku"}`
    : "heuristic";

export async function extractDetails(input: { fullName: string; description: string; readme: string }): Promise<{ details: ReturnType<typeof heuristicDetails>; extractor: string }> {
  const heur = heuristicDetails(input.readme, input.description);
  if (detailsExtractorId !== "heuristic") {
    try {
      const text = await llmExtract(
        `Repo: ${input.fullName}\nDescription: ${input.description || "(none)"}\n\nREADME (truncated):\n${input.readme.slice(0, 14000) || "(no README)"}`,
      );
      const raw = text ? parseJsonObject(text) : null;
      if (raw) {
        const d = normalize(raw, heur);
        if (!input.readme.trim()) d.source = "inferred";
        return { details: d, extractor: detailsExtractorId };
      }
    } catch (err) {
      console.warn(`extractDetails: LLM failed for ${input.fullName}, using heuristic`, (err as Error).message);
    }
  }
  return { details: heur, extractor: "heuristic" };
}
