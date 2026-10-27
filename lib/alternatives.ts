import { getRepo, getRepos } from "./data";
import { isThinRepo } from "./thin";
import type { Repo } from "./types";

/** Minimum alternatives (same category + shared GitHub topics) before an alternatives page is published. */
export const ALT_MIN = 3;

export interface Alternative {
  repo: Repo;
  sharedTopics: string[];
  sameLanguage: boolean;
}

/** A topic on more than this share of tracked repos (llm, mcp, ai-agents, claude-code...) says little about what a repo does. */
const BROAD_TOPIC_SHARE = 0.1;

let specificCache: ((t: string) => boolean) | null = null;
/**
 * True for topics that narrow down what a repo is: on at most 10% of tracked repos and not just a
 * programming-language tag (python, typescript), which the page already shows separately.
 */
function isSpecificTopic(t: string): boolean {
  if (!specificCache) {
    const repos = getRepos();
    const freq = new Map<string, number>();
    for (const r of repos) for (const x of new Set(r.topics)) freq.set(x, (freq.get(x) ?? 0) + 1);
    const langs = new Set(repos.map((r) => (r.language ?? "").toLowerCase().replace(/\s+/g, "-")).filter(Boolean));
    const max = repos.length * BROAD_TOPIC_SHARE;
    specificCache = (x) => (freq.get(x) ?? 0) <= max && !langs.has(x);
  }
  return specificCache(t);
}

/**
 * Alternatives = other tracked repos in the same category that share at least two GitHub topics,
 * at least one of them specific. Two broad tags alone ("llm" + "mcp") matched a docs MCP server
 * with a trading bot and a pentest agent. Purely data-derived; no editorial claims.
 */
export function getAlternatives(repo: Repo, limit = 12): Alternative[] {
  const topics = new Set(repo.topics);
  return getRepos()
    .filter((r) => r.fullName !== repo.fullName && r.category === repo.category)
    .map((r) => ({ repo: r, sharedTopics: r.topics.filter((t) => topics.has(t)), sameLanguage: !!r.language && r.language === repo.language }))
    .filter((a) => a.sharedTopics.length >= 2 && a.sharedTopics.some(isSpecificTopic))
    .sort((a, b) => b.sharedTopics.length - a.sharedTopics.length || b.repo.delta7d - a.repo.delta7d)
    .slice(0, limit);
}

/** Alternatives pages with fewer than this many topic-overlap matches also list other rising repos from the same category. */
export const ALT_SHORT = 6;

/**
 * For short alternatives pages: other rising repos in the same category that are neither the repo
 * nor one of its topic-overlap alternatives, by stars gained this week. Labeled on the page as
 * same-category only, not as alternatives.
 */
export function getCategoryNeighbors(repo: Repo, alts: Alternative[], limit = 6): Repo[] {
  if (alts.length >= ALT_SHORT) return [];
  const skip = new Set([repo.fullName, ...alts.map((a) => a.repo.fullName)]);
  return getRepos()
    .filter((r) => r.category === repo.category && !skip.has(r.fullName) && !isThinRepo(r))
    .sort((a, b) => b.delta7d - a.delta7d)
    .slice(0, limit);
}

export const hasAlternativesPage = (repo: Repo) => repo.category !== "other" && getAlternatives(repo).length >= ALT_MIN;
export const alternativesPath = (r: Pick<Repo, "owner" | "name">) => `/alternatives/${r.owner}/${r.name}`;
export const getAlternativesRepos = () => getRepos().filter(hasAlternativesPage);
export { getRepo };

/** Words that describe a kind of repo rather than name one ("agents", "claude-skills", "AI-Coding"). */
const GENERIC_NAME_WORDS = new Set(["ai", "agent", "agents", "skill", "skills", "claude", "coding", "code", "memory", "security", "tool", "tools", "mcp", "llm", "llms", "prompt", "prompts", "awesome", "cli", "app", "apps"]);

let dupNames: Set<string> | null = null;
/**
 * The name to use in "X alternatives" titles, headings and links. Usually the bare repo name, which is
 * what people search for ("dify alternatives"), but owner/name when the bare name is ambiguous: made only
 * of generic words (wshobson/agents, anbeime/skill) or shared by two tracked repos (two OpenBots).
 */
export function altLabel(r: Pick<Repo, "owner" | "name">): string {
  if (!dupNames) {
    const seen = new Map<string, number>();
    for (const x of getRepos()) seen.set(x.name.toLowerCase(), (seen.get(x.name.toLowerCase()) ?? 0) + 1);
    dupNames = new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
  }
  const words = r.name.toLowerCase().split(/[-_.\s]+/).filter(Boolean);
  const generic = words.length > 0 && words.every((w) => GENERIC_NAME_WORDS.has(w));
  return generic || dupNames.has(r.name.toLowerCase()) ? `${r.owner}/${r.name}` : r.name;
}
