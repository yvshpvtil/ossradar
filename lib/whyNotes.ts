import type { CategorySlug } from "./types";

/** Category-level "Why it matters" notes used by template one-liners (scripts/summarize.ts). */
export const WHY: Record<CategorySlug, string> = {
  "ai-agents": "worth a look if you build or run autonomous agents",
  "llm-tooling": "useful plumbing for shipping LLM-powered features",
  mcp: "extends what MCP-compatible assistants can connect to and do",
  "coding-agents": "relevant if AI is part of your coding workflow",
  "rag-vector": "relevant for grounding LLMs in your own data",
  "local-llms": "helps you run models on your own hardware without an API bill",
  devops: "worth a look for your infrastructure and delivery stack",
  other: "a developer project picking up unusual momentum",
};
