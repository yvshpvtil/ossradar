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
    keywords: ["model context protocol", "mcp server", "mcp-server", "mcp client"],
  },
  {
    slug: "coding-agents",
    topics: ["coding-agent", "coding-assistant", "code-generation", "ai-coding", "copilot", "claude-code", "code-agent", "vibe-coding", "codex", "cursor", "swe-agent", "ai-code-review"],
    keywords: ["coding agent", "coding assistant", "pair programmer", "code generation", "claude code", "software engineering agent", "ai coding", "code review", "vibe coding"],
  },
  {
    slug: "local-llms",
    topics: ["local-llm", "ollama", "llama-cpp", "llamacpp", "gguf", "quantization", "local-ai", "offline-ai", "mlx", "on-device"],
    keywords: ["local llm", "run locally", "locally", "on-device", "ollama", "llama.cpp", "gguf", "offline"],
  },
  {
    slug: "rag-vector",
    topics: ["rag", "vector-database", "vector-search", "embeddings", "retrieval-augmented-generation", "vectordb", "semantic-search", "knowledge-graph", "graphrag"],
    keywords: ["retrieval-augmented", "retrieval augmented", "vector database", "vector search", "embedding", " rag ", "rag ", "semantic search", "knowledge base"],
  },
  {
    slug: "ai-agents",
    topics: ["ai-agents", "ai-agent", "agents", "agent", "multi-agent", "autonomous-agents", "agentic", "agentic-ai", "agent-framework", "browser-use", "computer-use"],
    keywords: ["agent", "agentic", "autonomous"],
  },
  {
    slug: "llm-tooling",
    topics: ["llm", "llms", "large-language-models", "openai", "anthropic", "claude", "gpt", "chatgpt", "prompt-engineering", "llmops", "langchain", "fine-tuning", "inference", "evals", "llm-inference", "gemini", "deepseek", "generative-ai", "genai", "ai", "machine-learning", "transformers"],
    keywords: ["llm", "language model", "prompt", "gpt", "openai", "anthropic", "claude", "gemini", "inference", "fine-tun", "ai "],
  },
  {
    slug: "devops",
    topics: ["devops", "kubernetes", "k8s", "docker", "ci-cd", "cicd", "terraform", "infrastructure-as-code", "observability", "monitoring", "sre", "platform-engineering", "gitops", "self-hosted", "homelab", "cloud-native", "helm"],
    keywords: ["kubernetes", "docker", "devops", "ci/cd", "terraform", "observability", "monitoring", "deploy", "infrastructure"],
  },
];

export function categorize(input: { topics: string[]; description: string; name: string }): CategorySlug {
  const topics = new Set(input.topics.map((t) => t.toLowerCase()));
  const text = ` ${input.name.replace(/[-_]/g, " ")} ${input.description} `.toLowerCase();
  for (const rule of RULES) {
    if (rule.topics.some((t) => topics.has(t))) return rule.slug;
  }
  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(k))) return rule.slug;
  }
  return "other";
}
