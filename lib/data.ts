import raw from "@/data/repos.json";
import type { CategorySlug, Repo, RepoData } from "./types";

import { categorize } from "./categories";
import { isOffTopic } from "./blocklist";

const rawData = raw as RepoData;
/** Re-apply the current blocklist and categorizer so tuning takes effect without waiting for the next collect run. */
const data: RepoData = {
  ...rawData,
  repos: rawData.repos
    .filter((r) => !isOffTopic(r))
    .map((r) => ({ ...r, category: categorize({ topics: r.topics, description: r.description, name: r.name }) })),
};

export type Period = "today" | "week";

export function getData(): RepoData {
  return data;
}

export function getRepos(): Repo[] {
  return data.repos;
}

export function deltaFor(repo: Pick<Repo, "delta24h" | "delta7d">, period: Period): number {
  return period === "today" ? repo.delta24h : repo.delta7d;
}

export function rankRepos(repos: Repo[], period: Period): Repo[] {
  return [...repos].sort((a, b) => deltaFor(b, period) - deltaFor(a, period) || b.stars - a.stars);
}

export function getRepo(owner: string, name: string): Repo | undefined {
  const full = `${owner}/${name}`.toLowerCase();
  return data.repos.find((r) => r.fullName.toLowerCase() === full);
}

export function getReposByCategory(slug: CategorySlug): Repo[] {
  return data.repos.filter((r) => r.category === slug);
}

/** Repos in the same category, scored by topic overlap then velocity. */
export function getSimilarRepos(repo: Repo, limit = 6): Repo[] {
  const topics = new Set(repo.topics);
  return data.repos
    .filter((r) => r.fullName !== repo.fullName)
    .map((r) => ({
      r,
      score:
        (r.category === repo.category ? 3 : 0) +
        r.topics.filter((t) => topics.has(t)).length +
        (r.language && r.language === repo.language ? 0.5 : 0),
    }))
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score || b.r.delta7d - a.r.delta7d)
    .slice(0, limit)
    .map((x) => x.r);
}
