import { getData } from "./data";
import type { Repo } from "./types";

export const NEW_DAYS = 14;

/** Tracked repos created in the last NEW_DAYS days (by GitHub creation date), grouped by UTC day, newest first. */
export function getNewRepos(): { day: string; repos: Repo[] }[] {
  const data = getData();
  const cutoff = Date.parse(data.generatedAt) - NEW_DAYS * 86_400_000;
  const byDay = new Map<string, Repo[]>();
  for (const r of data.repos) {
    if (Date.parse(r.createdAt) < cutoff) continue;
    const day = r.createdAt.slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), r]);
  }
  return [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, repos]) => ({ day, repos: repos.sort((a, b) => b.stars - a.stars) }));
}
