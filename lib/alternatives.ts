import { getRepo, getRepos } from "./data";
import { isThinRepo } from "./thin";
import { repoTopics } from "./topics";
import type { Repo } from "./types";

/** Minimum alternatives (same category + shared GitHub topics) before an alternatives page is published. */
export const ALT_MIN = 3;

/** Alternatives pages with fewer than this many same-category matches also take close matches from other categories, then list other rising repos from the same category. */
export const ALT_SHORT = 6;

export interface Alternative {
  repo: Repo;
  sharedTopics: string[];
  /** False for a cross-category match, which needs a closer topic overlap (see isCloseMatch). */
  sameCategory: boolean;
  sameLanguage: boolean;
  /** Sum of topicWeight() over shared topics; ranks closest matches first. */
  score: number;
}

/** A topic on more than this share of tracked repos (llm, mcp, ai-agents, claude-code...) says little about what a repo does. */
const BROAD_TOPIC_SHARE = 0.1;

let specificCache: ((t: string) => boolean) | null = null;
let weightCache: ((t: string) => number) | null = null;
/**
 * How much sharing this topic says about two repos being alike: log(N / repos carrying it), so a
 * niche tag like "browser-automation" outweighs a common one like "llm" or "claude-code".
 */
function topicWeight(t: string): number {
  if (!weightCache) {
    const repos = getRepos();
    const freq = new Map<string, number>();
    for (const r of repos) for (const x of repoTopics(r)) freq.set(x, (freq.get(x) ?? 0) + 1);
    const n = repos.length;
    weightCache = (x) => Math.log(n / Math.max(1, freq.get(x) ?? 1));
  }
  return weightCache(t);
}
/**
 * True for topics that narrow down what a repo is: on at most 10% of tracked repos and not just a
 * programming-language tag (python, typescript), which the page already shows separately.
 */
function isSpecificTopic(t: string): boolean {
  if (!specificCache) {
    const repos = getRepos();
    const freq = new Map<string, number>();
    for (const r of repos) for (const x of repoTopics(r)) freq.set(x, (freq.get(x) ?? 0) + 1);
    const langs = new Set(repos.map((r) => (r.language ?? "").toLowerCase().replace(/\s+/g, "-")).filter(Boolean));
    const max = repos.length * BROAD_TOPIC_SHARE;
    specificCache = (x) => (freq.get(x) ?? 0) <= max && !langs.has(x);
  }
  return specificCache(t);
}

/** A topic on at most this share of tracked repos is niche: model families (qwen, llama), tools (playwright), not vendor tags. */
const NICHE_TOPIC_SHARE = 0.05;

/** Platform and packaging tags say where a repo runs, not what it does, so they never count as niche. */
const PLATFORM_TOPICS = new Set(["windows", "macos", "mac", "macos-app", "linux", "android", "ios", "desktop-app", "desktop", "cross-platform", "menubar-app", "web-app", "self-hosted", "open-source", "cli", "terminal", "tui", "docker"]);

/**
 * Tags about how a repo is built or listed rather than what it does: UI/app frameworks and repo
 * housekeeping labels. Like platform and language tags, they don't count toward a cross-category
 * match, so two unrelated Electron or SwiftUI apps aren't offered as alternatives to each other.
 */
const STACK_TOPICS = new Set(["electron", "tauri", "react", "nextjs", "vue", "svelte", "swiftui", "flutter", "good-first-issue", "hacktoberfest", "productivity", "developer-tools"]);

let langCache: Set<string> | null = null;
/** Programming-language tags (python, rust, swift...): the language of any tracked repo, plus common aliases. */
function isLanguageTopic(t: string): boolean {
  if (!langCache) {
    langCache = new Set(getRepos().map((r) => (r.language ?? "").toLowerCase().replace(/\s+/g, "-")).filter(Boolean));
    for (const x of ["golang", "cpp", "csharp", "nodejs", "node"]) langCache.add(x);
  }
  return langCache.has(t);
}

/** True for a shared topic that says what a repo does, not where it runs, what it's written in or built with. */
const isDescriptiveTopic = (t: string) => !PLATFORM_TOPICS.has(t) && !STACK_TOPICS.has(t) && !isLanguageTopic(t);

let nicheCache: ((t: string) => boolean) | null = null;
function isNicheTopic(t: string): boolean {
  if (!nicheCache) {
    const repos = getRepos();
    const freq = new Map<string, number>();
    for (const r of repos) for (const x of repoTopics(r)) freq.set(x, (freq.get(x) ?? 0) + 1);
    const max = repos.length * NICHE_TOPIC_SHARE;
    nicheCache = (x) => (freq.get(x) ?? 0) <= max && !PLATFORM_TOPICS.has(x) && isSpecificTopic(x);
  }
  return nicheCache(t);
}

/**
 * Same category: at least two shared topics, one of them specific. Another category (only used to
 * fill pages with fewer than ALT_SHORT same-category matches): at least three shared descriptive
 * topics (not platform, language or framework tags), two of them niche, since the category heuristic can split close peers (ollama sits in Local LLMs while
 * vllm, sglang and unsloth, which share its model-family tags, sit in LLM tooling).
 */
function isCloseMatch(shared: string[], sameCategory: boolean): boolean {
  return sameCategory
    ? shared.length >= 2 && shared.some(isSpecificTopic)
    : shared.filter(isDescriptiveTopic).length >= 3 && shared.filter((t) => isDescriptiveTopic(t) && isNicheTopic(t)).length >= 2;
}

/**
 * Alternatives = other tracked repos in the same category that share at least two GitHub topics,
 * at least one of them specific; pages short of ALT_SHORT also take closer matches from other categories
 * (isCloseMatch). Two broad tags alone ("llm" + "mcp") matched a docs MCP server
 * with a trading bot and a pentest agent. Ranked by how rare the shared topics are (IDF-weighted),
 * so two repos sharing a niche tag rank above two that only share more common ones. Purely
 * data-derived; no editorial claims. Topics are compared in canonical form (repoTopics), so alias
 * twins like dsh + deepseek-harness or mcp + model-context-protocol count once, not as two matches.
 */
export function getAlternatives(repo: Repo, limit = 12): Alternative[] {
  const topics = new Set(repoTopics(repo));
  const matches = getRepos()
    .filter((r) => r.fullName !== repo.fullName && r.category !== "other")
    .map((r) => {
      const sharedTopics = repoTopics(r).filter((t) => topics.has(t));
      const score = sharedTopics.reduce((s, t) => s + topicWeight(t), 0);
      return { repo: r, sharedTopics, sameCategory: r.category === repo.category, sameLanguage: !!r.language && r.language === repo.language, score };
    })
    .filter((a) => isCloseMatch(a.sharedTopics, a.sameCategory));
  const same = matches.filter((a) => a.sameCategory);
  return (same.length >= ALT_SHORT ? same : matches)
    .sort((a, b) => b.score - a.score || b.repo.delta7d - a.repo.delta7d)
    .slice(0, limit);
}

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
/**
 * The project's own capitalization of its name, when its GitHub description
 * spells it out (sglang -> "SGLang", ragflow -> "RAGFlow", context7 -> "Context7").
 * GitHub repo slugs are often lowercase while the project brands itself
 * otherwise; titles read better, and match how people write the name, with the
 * project's own spelling. Only a whole-token, case-insensitive match counts.
 */
function brandName(r: Pick<Repo, "name"> & { description?: string | null }): string {
  const desc = r.description ?? "";
  if (!desc || r.name !== r.name.toLowerCase()) return r.name;
  const esc = r.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = desc.match(new RegExp(`(?<![\\w/-])${esc}(?![\\w/-])`, "i"));
  return m && m[0] !== r.name ? m[0] : r.name;
}

export function altLabel(r: Pick<Repo, "owner" | "name"> & { description?: string | null }): string {
  if (!dupNames) {
    const seen = new Map<string, number>();
    for (const x of getRepos()) seen.set(x.name.toLowerCase(), (seen.get(x.name.toLowerCase()) ?? 0) + 1);
    dupNames = new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
  }
  const words = r.name.toLowerCase().split(/[-_.\s]+/).filter(Boolean);
  const generic = words.length > 0 && words.every((w) => GENERIC_NAME_WORDS.has(w));
  return generic || dupNames.has(r.name.toLowerCase()) ? `${r.owner}/${r.name}` : brandName(r);
}
