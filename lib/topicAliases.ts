/**
 * Singular/plural GitHub topic twins that would otherwise get two near-duplicate hub pages
 * (e.g. /topic/ai-agent and /topic/ai-agents). Each alias folds into the canonical slug: its repos
 * join the canonical hub, links point there, and next.config.ts 308-redirects /topic/<alias>.
 * Canonical = the form more tracked repos use (as of Oct 2026). Kept explicit so redirects stay stable.
 * No imports here: next.config.ts reads this file.
 */
export const TOPIC_ALIASES: Record<string, string> = {
  "ai-agent": "ai-agents",
  agents: "agent",
  "coding-agent": "coding-agents",
  llms: "llm",
};

export const canonicalTopic = (slug: string): string => TOPIC_ALIASES[slug] ?? slug;

/** Slugs that fold into `slug` (the canonical slug itself first), e.g. ai-agents -> ["ai-agents", "ai-agent"]. */
export const topicVariants = (slug: string): string[] => [slug, ...Object.keys(TOPIC_ALIASES).filter((a) => TOPIC_ALIASES[a] === slug)];
