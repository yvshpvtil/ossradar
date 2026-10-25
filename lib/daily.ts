import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getData, getRepos, isExcludedName } from "./data";
import type { Repo } from "./types";

const DIR = path.join(process.cwd(), "data", "snapshots");
const snap = (d: string) => JSON.parse(readFileSync(path.join(DIR, `${d}.json`), "utf8")) as Record<string, number>;
const prevDay = (d: string) => new Date(Date.parse(d + "T00:00:00Z") - 86_400_000).toISOString().slice(0, 10);

export type DailyEntry = { fullName: string; gained: number; stars: number; repo?: Repo };

/** Completed UTC days that have a snapshot for the day before, so gains are measured, not estimated. Newest first. */
export function getArchiveDays(): string[] {
  const today = getData().snapshotDate;
  let files: string[] = [];
  try {
    files = readdirSync(DIR);
  } catch {
    return []; // snapshots are read at build time; a runtime without them just shows no archive
  }
  const have = new Set(files.filter((f) => f.endsWith(".json")).map((f) => f.slice(0, 10)));
  return [...have].filter((d) => d < today && have.has(prevDay(d))).sort().reverse();
}

/** Top repos by stars gained on one archived day (snapshot D minus snapshot D-1). */
export function getDailyTop(date: string, limit = 25): DailyEntry[] {
  const cur = snap(date), prev = snap(prevDay(date));
  const byName = new Map(getRepos().map((r) => [r.fullName, r]));
  return Object.entries(cur)
    .filter(([n]) => prev[n] !== undefined && !isExcludedName(n))
    .map(([fullName, stars]) => ({ fullName, stars, gained: stars - prev[fullName], repo: byName.get(fullName) }))
    .filter((e) => e.gained > 0)
    .sort((a, b) => b.gained - a.gained)
    .slice(0, limit);
}

export type DailyAppearance = { date: string; rank: number; gained: number };
let appearances: Map<string, DailyAppearance[]> | null = null;

/** Archived days on which a repo made the daily top 25, newest first (built once per process). */
export function getDailyAppearances(fullName: string): DailyAppearance[] {
  if (!appearances) {
    const map = new Map<string, DailyAppearance[]>();
    for (const date of getArchiveDays()) {
      getDailyTop(date).forEach((e, i) => {
        const list = map.get(e.fullName) ?? [];
        list.push({ date, rank: i + 1, gained: e.gained });
        map.set(e.fullName, list);
      });
    }
    appearances = map;
  }
  return appearances.get(fullName) ?? [];
}

export type DaySummary = {
  count: number;
  total: number;
  leader: DailyEntry | null;
  /** Leader's share of the list's combined gain, 0-100. */
  leaderShare: number;
  /** Most common non-"other" categories on the list, with counts (max 2). */
  categories: { slug: Repo["category"]; count: number }[];
  /** Previous archived day, when there is one. */
  prevDate: string | null;
  /** Repos also in the previous archived day's list (only when prevDate is set). */
  repeat: number;
  /** Repos created on GitHub in the 7 days up to and including this day. */
  createdThisWeek: number;
};

/** Facts about one archived day's list, computed from the snapshots, so each archive page has its own summary. */
export function getDaySummary(date: string): DaySummary {
  const top = getDailyTop(date);
  const total = top.reduce((s, e) => s + e.gained, 0);
  const leader = top[0] ?? null;
  const counts = new Map<Repo["category"], number>();
  for (const e of top) if (e.repo && e.repo.category !== "other") counts.set(e.repo.category, (counts.get(e.repo.category) ?? 0) + 1);
  const categories = [...counts.entries()].map(([slug, count]) => ({ slug, count })).sort((a, b) => b.count - a.count).filter((c) => c.count >= 2).slice(0, 2);
  const days = getArchiveDays();
  const prevDate = days[days.indexOf(date) + 1] ?? null;
  const prevNames = prevDate ? new Set(getDailyTop(prevDate).map((e) => e.fullName)) : null;
  const repeat = prevNames ? top.filter((e) => prevNames.has(e.fullName)).length : 0;
  const end = Date.parse(date + "T23:59:59Z");
  const createdThisWeek = top.filter((e) => e.repo && end - Date.parse(e.repo.createdAt) < 7 * 86_400_000 && Date.parse(e.repo.createdAt) <= end).length;
  return { count: top.length, total, leader, leaderShare: total ? Math.round((leader!.gained / total) * 100) : 0, categories, prevDate, repeat, createdThisWeek };
}
