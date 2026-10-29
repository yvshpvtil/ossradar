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
  // Agent skill tags come singular and plural; the plural is far more used (agent-skills 54 vs 7, claude-skills 32 vs 4,
  // claude-code-skills 10 vs 6, skills 19 vs 7 tracked repos), so the singular repos join the hub people already land on.
  "agent-skill": "agent-skills",
  "claude-skill": "claude-skills",
  "claude-code-skill": "claude-code-skills",
  skill: "skills",
  // Twins of existing hubs, folded into the form most tracked repos use: claude-code-plugin 17 vs claude-code-plugins 2,
  // dsh-plugin 24 vs dsh-plugins 4, chatbot 12 vs chatbots 1, developer-tools 49 vs developer-tool 1 (Oct 29 2026).
  "claude-code-plugins": "claude-code-plugin",
  "dsh-plugins": "dsh-plugin",
  chatbots: "chatbot",
  "developer-tool": "developer-tools",
  // More spellings of existing hubs (Oct 29 2026): multiagent / multi-agent-system(s) are multi-agent (17 tracked repos;
  // brings in langchain, langgraph, TradingAgents, DeepTutor and others), and genai / gen-ai are the common abbreviation
  // of generative-ai (18; brings in dify, mem0, onyx, LightRAG).
  multiagent: "multi-agent",
  "multi-agent-system": "multi-agent",
  "multi-agent-systems": "multi-agent",
  genai: "generative-ai",
  "gen-ai": "generative-ai",
};

/**
 * GitHub topics that just name a programming language. Their topic hubs (/topic/python, "Trending Python GitHub repos")
 * competed with the language hubs (/language/python, "Trending Python repos on GitHub") for the same searches, with a
 * smaller, looser list (repos tagged python, not repos written mainly in Python). They get no topic hub: next.config.ts
 * 308-redirects /topic/<tag> to /language/<slug>, and repo topic chips link the language hub.
 * Only languages with a long-standing hub (10+ tracked repos) are listed, so a redirect never lands on a 404.
 */
export const LANGUAGE_TOPICS: Record<string, string> = {
  python: "python",
  typescript: "typescript",
  javascript: "javascript",
  rust: "rust",
  golang: "go",
  go: "go",
};

export const canonicalTopic = (slug: string): string => TOPIC_ALIASES[slug] ?? slug;

/** Slugs that fold into `slug` (the canonical slug itself first), e.g. ai-agents -> ["ai-agents", "ai-agent"]. */
export const topicVariants = (slug: string): string[] => [slug, ...Object.keys(TOPIC_ALIASES).filter((a) => TOPIC_ALIASES[a] === slug)];
