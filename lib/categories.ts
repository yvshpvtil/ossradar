import type { CategorySlug } from "./types";

export interface Category {
  slug: CategorySlug;
  label: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "ai-agents",
    label: "AI agents",
    description: "Autonomous and multi-agent frameworks, agent runtimes and orchestration.",
  },
  {
    slug: "llm-tooling",
    label: "LLM tooling",
    description: "SDKs, prompt tooling, evals, gateways, fine-tuning and inference libraries.",
  },
  {
    slug: "mcp",
    label: "MCP",
    description: "Model Context Protocol servers, clients and tooling.",
  },
  {
    slug: "coding-agents",
    label: "Coding agents",
    description: "AI pair programmers, code-generation agents and IDE assistants.",
  },
  {
    slug: "rag-vector",
    label: "RAG / vector",
    description: "Retrieval-augmented generation, vector databases, embeddings and search.",
  },
  {
    slug: "local-llms",
    label: "Local LLMs",
    description: "Run models on your own hardware: runtimes, quantization and desktop apps.",
  },
  {
    slug: "devops",
    label: "DevOps",
    description: "Infrastructure, CI/CD, observability, containers and platform tooling.",
  },
  {
    slug: "other",
    label: "Other",
    description: "Developer tools and AI projects that don't fit a single bucket.",
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryLabel(slug: CategorySlug): string {
  return getCategory(slug)?.label ?? slug;
}

/** Ordered rules: first match wins. Topics are matched exactly, keywords as substrings. */
const RULES: { slug: CategorySlug; topics: string[]; keywords: string[] }[] = [
  {
    slug: "mcp",
    topics: ["mcp", "model-context-protocol", "mcp-server", "mcp-client", "mcp-servers", "modelcontextprotocol"],
    keywords: ["model context protocol", "mcp server", "mcp-server", "mcp client", " mcp "],
  },
  {
    slug: "coding-agents",
    topics: ["coding-agent", "coding-assistant", "code-generation", "ai-coding", "copilot", "claude-code", "code-agent", "vibe-coding", "codex", "cursor", "swe-agent", "ai-code-review"],
    keywords: ["coding agent", "coding assistant", "pair programmer", "code generation", "claude code", "software engineering agent", "ai coding", "code review", "vibe coding"],
  },
  {
    slug: "local-llms",
    topics: ["local-llm", "ollama", "llama-cpp", "llamacpp", "gguf", "quantization", "local-ai", "offline-ai", "mlx", "on-device"],
    keywords: ["local llm", "run locally", "runs locally", "on-device", "ollama", "llama.cpp", "gguf", "offline llm", "consumer hardware", "local model"],
  },
  {
    slug: "rag-vector",
    topics: ["rag", "vector-database", "vector-search", "embeddings", "retrieval-augmented-generation", "vectordb", "semantic-search", "knowledge-graph", "graphrag"],
    keywords: ["retrieval-augmented", "retrieval augmented", "vector database", "vector search", "embedding", " rag ", "rag ", "semantic search", "knowledge base"],
  },
  {
    slug: "ai-agents",
    topics: ["ai-agents", "ai-agent", "agents", "agent", "multi-agent", "autonomous-agents", "agentic", "agentic-ai", "agent-framework", "browser-use", "computer-use"],
    keywords: ["ai agent", "agents", "agentic", "autonomous", "multi-agent", "web agent", "智能体"],
  },
  {
    slug: "llm-tooling",
    topics: ["llm", "llms", "large-language-models", "openai", "anthropic", "claude", "gpt", "chatgpt", "prompt-engineering", "llmops", "langchain", "fine-tuning", "inference", "evals", "llm-inference", "gemini", "deepseek", "generative-ai", "genai", "ai", "machine-learning", "transformers"],
    keywords: ["llm", "language model", "prompt", "gpt", "openai", "anthropic", "claude", "gemini", "inference", "fine-tun", "ai "],
  },
  {
    slug: "devops",
    topics: ["devops", "kubernetes", "k8s", "docker", "ci-cd", "cicd", "terraform", "infrastructure-as-code", "observability", "monitoring", "sre", "platform-engineering", "gitops", "self-hosted", "homelab", "cloud-native", "helm"],
    keywords: ["kubernetes", "docker", "devops", "ci/cd", "terraform", "observability", "monitoring", "deploy", "infrastructure", "self-hosted"],
  },
];

/**
 * Score-based categorization. Previously the first matching topic won, which dumped any repo
 * that merely tagged itself "mcp" into MCP even when it was clearly a coding agent. Now every
 * rule is scored (topic hit = 2, keyword hit in name/description = 3, since the description is
 * what the author actually says the repo is). Highest score wins; ties go to rule order.
 */
/**
 * Tags authors add because they built the project with an AI coding tool, not because the
 * project is one (e.g. an Android TV debloater tagged claude-code and vibe-coding).
 */
const BUILT_WITH_TOPICS = new Set(["claude-code", "vibe-coding", "cursor", "codex", "copilot"]);
const AI_SIGNAL = /\b(ai|llms?|agents?|agentic|claude|codex|cursor|copilot|gemini|coding|code|codebase|prompts?|models?|gpt|chatgpt|opencode|mcp)\b/i;

export function categorize(input: { topics: string[]; description: string; name: string }): CategorySlug {
  const name = input.name.replace(/[-_]/g, " ");
  // Built-with tags only count when the name or description says the repo is about AI or code;
  // with no description we can't tell, so they still count.
  const ignoreBuiltWith = input.description.trim() !== "" && !AI_SIGNAL.test(`${name} ${input.description}`);
  const topics = new Set(
    input.topics.map((t) => t.toLowerCase()).filter((t) => !(ignoreBuiltWith && BUILT_WITH_TOPICS.has(t))),
  );
  const text = ` ${name} ${input.description} `.toLowerCase();
  let best: CategorySlug = "other";
  let bestScore = 0;
  for (const rule of RULES) {
    const score =
      rule.topics.filter((t) => topics.has(t)).length * 2 + rule.keywords.filter((k) => text.includes(k)).length * 3;
    if (score > bestScore) {
      best = rule.slug;
      bestScore = score;
    }
  }
  return best === "other" ? fallbackCategory(input.name, input.description, topics) : best;
}

/**
 * Second pass for repos the main rules leave in Other. The main keywords miss singular "agent",
 * agent harnesses, agent skills (often written "skill：" next to CJK text), "MCP" glued to CJK
 * text or punctuation, and DeepSeek Harness (DSH) plugins, so clearly-AI repos like
 * "Agent harness for learning difficult things." landed in Other next to TV launchers. This only
 * runs when nothing else matched, so established categories (and their hub pages) don't churn.
 */
const FALLBACK: { slug: CategorySlug; test: RegExp }[] = [
  // Word-bounded MCP, but "no MCP" / "without MCP" says what the repo is not.
  { slug: "mcp", test: /(^|[^a-z])(?<!\b(?:no|without|instead of) )mcp([^a-z]|$)/ },
  { slug: "llm-tooling", test: /deepseek|\bdsh\b|context window|\btokens?\b|\bminimax\b|\bhunyuan\b/ },
  { slug: "ai-agents", test: /\bagents?\b|agent[- ]native|harness|\bskills?\b|copilotkit|ag-ui/ },
];

function fallbackCategory(name: string, description: string, topics: Set<string>): CategorySlug {
  const text = ` ${name} ${description} ${[...topics].join(" ")} `.toLowerCase();
  return FALLBACK.find((f) => f.test.test(text))?.slug ?? "other";
}
