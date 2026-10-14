import { getRepo, getRepos } from "./data";
import type { Repo } from "./types";

/** Minimum alternatives (same category + shared GitHub topics) before an alternatives page is published. */
export const ALT_MIN = 3;

export interface Alternative {
  repo: Repo;
  sharedTopics: string[];
  sameLanguage: boolean;
}

/**
 * Alternatives = other tracked repos in the same category that share at least two GitHub topics.
 * Purely data-derived; no editorial claims.
 */
export function getAlternatives(repo: Repo, limit = 12): Alternative[] {
  const topics = new Set(repo.topics);
  return getRepos()
    .filter((r) => r.fullName !== repo.fullName && r.category === repo.category)
    .map((r) => ({ repo: r, sharedTopics: r.topics.filter((t) => topics.has(t)), sameLanguage: !!r.language && r.language === repo.language }))
    .filter((a) => a.sharedTopics.length >= 2)
    .sort((a, b) => b.sharedTopics.length - a.sharedTopics.length || b.repo.delta7d - a.repo.delta7d)
    .slice(0, limit);
}

export const hasAlternativesPage = (repo: Repo) => repo.category !== "other" && getAlternatives(repo).length >= ALT_MIN;
export const alternativesPath = (r: Pick<Repo, "owner" | "name">) => `/alternatives/${r.owner}/${r.name}`;
export const getAlternativesRepos = () => getRepos().filter(hasAlternativesPage);
export { getRepo };
