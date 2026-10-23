import type { Repo } from "./types";
import { stripWhy } from "./why";

/** Slim repo shape sent to the client-side leaderboard. */
export type LeaderRepo = Pick<
  Repo,
  | "fullName"
  | "owner"
  | "name"
  | "oneLiner"
  | "category"
  | "language"
  | "stars"
  | "delta24h"
  | "delta7d"
  | "estimated24h"
  | "estimated7d"
  | "ownerAvatar"
  | "delta1h"
  | "firstSeen"
  | "prevRank"
  | "createdAt"
> & { spark: number[]; /** Rank by 24h gain over the whole tracked list. */ rank24?: number };

export function toLeaderRepo(r: Repo): LeaderRepo {
  return {
    fullName: r.fullName,
    owner: r.owner,
    name: r.name,
    // Rows show only "what it is"; the generic "Why it matters" note stays on the repo page.
    oneLiner: stripWhy(r.oneLiner),
    category: r.category,
    language: r.language,
    stars: r.stars,
    delta24h: r.delta24h,
    delta7d: r.delta7d,
    estimated24h: r.estimated24h,
    estimated7d: r.estimated7d,
    ownerAvatar: r.ownerAvatar,
    delta1h: r.delta1h ?? null,
    firstSeen: r.firstSeen ?? "",
    prevRank: r.prevRank ?? null,
    createdAt: r.createdAt,
    spark: r.history.map((h) => h.stars),
  };
}

/** Leader rows with rank24 filled in from the full list (needed when only a slice is sent). */
export function toLeaderRepos(repos: Repo[]): LeaderRepo[] {
  const rank = new Map<string, number>();
  [...repos].sort((a, b) => b.delta24h - a.delta24h || b.stars - a.stars).forEach((r, i) => rank.set(r.fullName, i + 1));
  return repos.map((r) => ({ ...toLeaderRepo(r), rank24: rank.get(r.fullName) }));
}

/** Summary of the full list so filters and counts are correct before the rest is loaded. */
export interface LeaderMeta {
  total: number;
  counts: Record<string, number>;
  languages: [string, number][];
  newWeekCount: number;
}

export function leaderMeta(repos: Repo[], refMs: number): LeaderMeta {
  const counts: Record<string, number> = {};
  const langs: Record<string, number> = {};
  for (const r of repos) {
    counts[r.category] = (counts[r.category] ?? 0) + 1;
    if (r.language) langs[r.language] = (langs[r.language] ?? 0) + 1;
  }
  return {
    total: repos.length,
    counts,
    languages: Object.entries(langs).sort((a, b) => b[1] - a[1]),
    newWeekCount: repos.filter((r) => refMs - Date.parse(r.createdAt) <= 7 * 86_400_000).length,
  };
}

/** Rows the leaderboard renders before "Show more" (the rest load client-side, so they aren't in the HTML). */
export const LEADERBOARD_PAGE = 50;

/**
 * Leaderboard props for a hub page (category, topic, language, trending view). Big hubs used to ship every row
 * in the page's RSC payload (~100 KB of JSON on the largest hubs) although only the first LEADERBOARD_PAGE are
 * rendered; now they server-render the same first rows and fetch the shared, CDN-cached /leaderboard.json on
 * idle or first interaction, narrowed to this hub's repos via `only`.
 */
export function hubLeaderProps(repos: Repo[], period: "today" | "week", refMs: number) {
  if (repos.length <= LEADERBOARD_PAGE) return { repos: repos.map(toLeaderRepo) };
  const key = period === "today" ? "delta24h" : "delta7d";
  const first = [...repos].sort((a, b) => b[key] - a[key] || b.stars - a.stars).slice(0, LEADERBOARD_PAGE);
  return {
    repos: first.map(toLeaderRepo),
    fullUrl: "/leaderboard.json",
    meta: leaderMeta(repos, refMs),
    only: repos.map((r) => r.fullName),
  };
}
