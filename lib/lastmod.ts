import type { Repo } from "@/lib/types";
import { getAlternatives } from "@/lib/alternatives";

/** Last day the repo's data actually changed (latest snapshot with a different star count), else its last code push; never after `cap`. */
export function repoLastmod(r: Repo, cap: Date): Date {
  const h = r.history;
  for (let i = h.length - 1; i > 0; i--) {
    if (h[i].stars !== h[i - 1].stars) {
      const d = new Date(`${h[i].date}T23:59:59Z`);
      return d > cap ? cap : d;
    }
  }
  const p = new Date(r.pushedAt);
  return p > cap ? cap : p;
}

/** An alternatives page changes when the repo or any listed alternative's data changes, not on every hourly build. */
export function alternativesLastmod(r: Repo, cap: Date): Date {
  let latest = repoLastmod(r, cap);
  for (const a of getAlternatives(r)) {
    const d = repoLastmod(a.repo, cap);
    if (d > latest) latest = d;
  }
  return latest;
}
