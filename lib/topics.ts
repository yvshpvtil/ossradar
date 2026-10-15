import { getRepos } from "./data";
import type { Repo } from "./types";

export const TOPIC_MIN = 10;

/** GitHub topics used by at least TOPIC_MIN tracked repos, most used first. Only these get a hub page. */
export function getTopics(): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of getRepos()) for (const t of r.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].filter(([, n]) => n >= TOPIC_MIN).sort((a, b) => b[1] - a[1]).map(([slug, count]) => ({ slug, count }));
}

export const hasTopicPage = (slug: string) => getTopics().some((t) => t.slug === slug);
export const getReposByTopic = (slug: string): Repo[] => getRepos().filter((r) => r.topics.includes(slug));

/** Proper casing for acronyms and product names that appear in GitHub topic slugs. */
const TOKEN_LABELS: Record<string, string> = {
  ai: "AI", llm: "LLM", llms: "LLMs", mcp: "MCP", cli: "CLI", tui: "TUI", rag: "RAG", gpt: "GPT", dsh: "DSH",
  openai: "OpenAI", chatgpt: "ChatGPT", anthropic: "Anthropic", claude: "Claude", deepseek: "DeepSeek", gemini: "Gemini",
  qwen: "Qwen", ollama: "Ollama", codex: "Codex", cursor: "Cursor", opencode: "OpenCode", openclaw: "OpenClaw",
  hermes: "Hermes", typescript: "TypeScript", javascript: "JavaScript", python: "Python", rust: "Rust", swift: "Swift",
  golang: "Go", react: "React", nextjs: "Next.js", docker: "Docker", playwright: "Playwright", electron: "Electron",
  macos: "macOS", windows: "Windows", linux: "Linux", android: "Android",
};
/** Whole-slug names that token casing can't get right. */
const SLUG_LABELS: Record<string, string> = {
  "claude-code": "Claude Code", "claude-code-plugin": "Claude Code plugin", "model-context-protocol": "Model Context Protocol",
  "claude-skills": "Claude skills", "gemini-cli": "Gemini CLI",
};
/** Slugs whose hyphen is part of the normal spelling. */
const KEEP_HYPHEN = new Set(["self-hosted", "local-first", "open-source", "multi-agent"]);

/** Human-readable name for a topic slug, e.g. "llm" -> "LLM", "claude-code" -> "Claude Code", "ai-agents" -> "AI agents". */
export function topicLabel(slug: string): string {
  if (SLUG_LABELS[slug]) return SLUG_LABELS[slug];
  if (KEEP_HYPHEN.has(slug)) return slug;
  return slug.split("-").map((w) => TOKEN_LABELS[w] ?? w).join(" ");
}
