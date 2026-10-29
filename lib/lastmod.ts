import type { Repo } from "@/lib/types";
import { getAlternatives } from "@/lib/alternatives";

/**
 * Day (YYYY-MM-DD) the repo's data last changed: the latest snapshot with a different star count, else its last code push.
 * Day precision on purpose: the hourly pipeline rewrites today's snapshot, so a timestamp would move every build while the
 * day only moves when a new day's data lands. Never later than `cap`'s day.
 */
export function repoLastmod(r: Repo, cap: Date): string {
  const capDay = cap.toISOString().slice(0, 10);
  const h = r.history;
  let day = new Date(r.pushedAt).toISOString().slice(0, 10);
  for (let i = h.length - 1; i > 0; i--) {
    if (h[i].stars !== h[i - 1].stars) {
      day = h[i].date;
      break;
    }
  }
  return day > capDay ? capDay : day;
}

/** An alternatives page changes when the repo or any listed alternative's data changes, not on every hourly build. */
export function alternativesLastmod(r: Repo, cap: Date): string {
  let latest = repoLastmod(r, cap);
  for (const a of getAlternatives(r)) {
    const d = repoLastmod(a.repo, cap);
    if (d > latest) latest = d;
  }
  return latest;
}
