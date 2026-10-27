/**
 * Singular/plural GitHub topic twins, or an abbreviation and its spelled-out name, that would otherwise
 * get two near-duplicate hub pages (e.g. /topic/ai-agent and /topic/ai-agents, /topic/dsh and /topic/deepseek-harness, /topic/model-context-protocol and /topic/mcp). Each alias folds into the canonical slug: its repos
 * join the canonical hub, links point there, and next.config.ts 308-redirects /topic/<alias>.
 * Canonical = the form more tracked repos use (as of Oct 2026). Kept explicit so redirects stay stable.
 * No imports here: next.config.ts reads this file.
 */
export const TOPIC_ALIASES: Record<string, string> = {
  "ai-agent": "ai-agents",
  agents: "agent",
  "coding-agent": "coding-agents",
  llms: "llm",
  // DSH is DeepSeek Harness's own abbreviation; the spelled-out name is what people search for.
  dsh: "deepseek-harness",
  // Model Context Protocol is MCP spelled out; 16 of its 17 tracked repos also carry the mcp topic.
  "model-context-protocol": "mcp",
  modelcontextprotocol: "mcp",
  // Codex CLI is the Codex coding agent; every tracked codex-cli repo is about that tool, and 8 of 10 already carry codex.
  "codex-cli": "codex",
};

export const canonicalTopic = (slug: string): string => TOPIC_ALIASES[slug] ?? slug;

/** Slugs that fold into `slug` (the canonical slug itself first), e.g. ai-agents -> ["ai-agents", "ai-agent"]. */
export const topicVariants = (slug: string): string[] => [slug, ...Object.keys(TOPIC_ALIASES).filter((a) => TOPIC_ALIASES[a] === slug)];
