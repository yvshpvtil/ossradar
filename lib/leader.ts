import type { Repo } from "./types";

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
> & { spark: number[] };

export function toLeaderRepo(r: Repo): LeaderRepo {
  return {
    fullName: r.fullName,
    owner: r.owner,
    name: r.name,
    oneLiner: r.oneLiner,
    category: r.category,
    language: r.language,
    stars: r.stars,
    delta24h: r.delta24h,
    delta7d: r.delta7d,
    estimated24h: r.estimated24h,
    estimated7d: r.estimated7d,
    ownerAvatar: r.ownerAvatar,
    spark: r.history.map((h) => h.stars),
  };
}
