import { getRepos } from "./data";
import type { Repo } from "./types";
import { canonicalTopic } from "./topicAliases";

export { canonicalTopic, topicVariants } from "./topicAliases";

export const TOPIC_MIN = 10;

/** GitHub topics used by at least TOPIC_MIN tracked repos, most used first. Only these get a hub page. */
export function getTopics(): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of getRepos()) for (const t of repoTopics(r)) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].filter(([, n]) => n >= TOPIC_MIN).sort((a, b) => b[1] - a[1]).map(([slug, count]) => ({ slug, count }));
}

export const hasTopicPage = (slug: string) => getTopics().some((t) => t.slug === slug);
/** A repo's topics with singular/plural twins folded into their canonical slug, deduped, original order. */
export const repoTopics = (r: Pick<Repo, "topics">): string[] => [...new Set(r.topics.map(canonicalTopic))];
export const getReposByTopic = (slug: string): Repo[] => getRepos().filter((r) => repoTopics(r).includes(slug));

/** Proper casing for acronyms and product names that appear in GitHub topic slugs. */
const TOKEN_LABELS: Record<string, string> = {
  ai: "AI", llm: "LLM", llms: "LLMs", mcp: "MCP", cli: "CLI", tui: "TUI", rag: "RAG", gpt: "GPT", dsh: "DSH",
  openai: "OpenAI", chatgpt: "ChatGPT", anthropic: "Anthropic", claude: "Claude", deepseek: "DeepSeek", gemini: "Gemini",
  qwen: "Qwen", ollama: "Ollama", codex: "Codex", cursor: "Cursor", opencode: "OpenCode", openclaw: "OpenClaw",
  hermes: "Hermes", typescript: "TypeScript", javascript: "JavaScript", python: "Python", rust: "Rust", swift: "Swift",
  golang: "Go", react: "React", nextjs: "Next.js", docker: "Docker", playwright: "Playwright", electron: "Electron",
  macos: "macOS", windows: "Windows", linux: "Linux", android: "Android",
  // Product, company and acronym names that are close to (or already over) the hub threshold.
  workbuddy: "WorkBuddy", antigravity: "Antigravity", mcdonalds: "McDonald's", grok: "Grok", glm: "GLM", gemma: "Gemma",
  llama: "Llama", copilot: "Copilot", cline: "Cline", kiro: "Kiro", google: "Google", ios: "iOS", api: "API", ui: "UI",
  sqlite: "SQLite", postgresql: "PostgreSQL", mysql: "MySQL", mongodb: "MongoDB", redis: "Redis", nodejs: "Node.js",
  vue: "Vue", svelte: "Svelte", tauri: "Tauri", swiftui: "SwiftUI", tailwindcss: "Tailwind CSS", threejs: "Three.js",
  langchain: "LangChain", langgraph: "LangGraph", pytorch: "PyTorch", fastapi: "FastAPI", cuda: "CUDA", mlx: "MLX",
  gguf: "GGUF", lora: "LoRA", qlora: "QLoRA", moe: "MoE", nlp: "NLP", tts: "TTS", ocr: "OCR", pdf: "PDF", seo: "SEO",
  aigc: "AIGC", genai: "GenAI", llmops: "LLMOps", devops: "DevOps", webrtc: "WebRTC", webgl: "WebGL", html: "HTML",
  svg: "SVG", pwa: "PWA", ffmpeg: "FFmpeg", obsidian: "Obsidian", blender: "Blender", unity: "Unity", wechat: "WeChat",
  git: "Git", esp32: "ESP32", "3d": "3D",
};
/** Whole-slug names that token casing can't get right. */
const SLUG_LABELS: Record<string, string> = {
  "claude-code": "Claude Code", "claude-code-plugin": "Claude Code plugin", "model-context-protocol": "Model Context Protocol",
  "claude-skills": "Claude skills", "gemini-cli": "Gemini CLI", "llama-cpp": "llama.cpp", "gpt-oss": "gpt-oss",
  "deepseek-harness": "DeepSeek Harness",
};
/** Slugs whose hyphen is part of the normal spelling. */
const KEEP_HYPHEN = new Set(["self-hosted", "local-first", "open-source", "multi-agent"]);

/** Human-readable name for a topic slug, e.g. "llm" -> "LLM", "claude-code" -> "Claude Code", "ai-agents" -> "AI agents". */
export function topicLabel(slug: string): string {
  if (SLUG_LABELS[slug]) return SLUG_LABELS[slug];
  if (KEEP_HYPHEN.has(slug)) return slug;
  return slug.split("-").map((w) => TOKEN_LABELS[w] ?? w).join(" ");
}

/**
 * Topic hubs most used by a set of repos (e.g. a category or language hub's members), most overlap first.
 * Small hubs need fewer shared repos to count, so thin category/language pages still link their real topic hubs.
 */
export function relatedTopics(repos: Pick<Repo, "topics">[], opts: { exclude?: string; limit?: number } = {}): { slug: string; overlap: number }[] {
  const min = repos.length < 20 ? 2 : 3;
  return getTopics()
    .filter((t) => t.slug !== opts.exclude)
    .map((t) => ({ slug: t.slug, overlap: repos.filter((r) => repoTopics(r).includes(t.slug)).length }))
    .filter((t) => t.overlap >= min)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, opts.limit ?? 12);
}
