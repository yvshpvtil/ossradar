import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getData, getRepos } from "./data";
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
    .filter(([n]) => prev[n] !== undefined)
    .map(([fullName, stars]) => ({ fullName, stars, gained: stars - prev[fullName], repo: byName.get(fullName) }))
    .filter((e) => e.gained > 0)
    .sort((a, b) => b.gained - a.gained)
    .slice(0, limit);
}
