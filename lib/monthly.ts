import { getArchiveDays, getDailyTop, readSnapshot } from "./daily";
import { getRepos, isExcludedName } from "./data";
import type { Repo } from "./types";

/**
 * Monthly roundups (/monthly/{YYYY-MM}): which tracked repos gained the most GitHub stars in one
 * calendar month, measured from the same daily snapshots as the /daily archive. Targets
 * "top GitHub repos of {month} {year}" searches and gives chatbots a dated, citable monthly list.
 * Everything is read from data/snapshots at build time, so every month page is prerendered.
 */

export type MonthEntry = { fullName: string; gained: number; stars: number; repo?: Repo; newThisMonth: boolean; daysInTop: number; daysAtOne: number };
export type MonthWindow = { month: string; from: string; to: string; baseline: string; complete: boolean; days: string[] };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const monthLabel = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
const nextDay = (d: string) => new Date(Date.parse(d + "T00:00:00Z") + 86_400_000).toISOString().slice(0, 10);
const lastDayOf = (m: string) => new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0)).toISOString().slice(0, 10);

/**
 * Each month that has at least one archived day, newest first. Gains are measured from the snapshot
 * at the end of the previous month (or, for the first month we tracked, the first snapshot) to the
 * newest archived day in the month, so a month in progress is labelled "so far".
 */
export function getMonthWindows(): MonthWindow[] {
  const days = getArchiveDays(); // newest first; each has the previous day's snapshot
  const byMonth = new Map<string, string[]>();
  for (const d of days) byMonth.set(d.slice(0, 7), [...(byMonth.get(d.slice(0, 7)) ?? []), d]);
  return [...byMonth.entries()].map(([month, ds]) => {
    const asc = [...ds].sort();
    const baseline = new Date(Date.parse(asc[0] + "T00:00:00Z") - 86_400_000).toISOString().slice(0, 10);
    const to = asc[asc.length - 1];
    return { month, from: nextDay(baseline), to, baseline, complete: to === lastDayOf(month), days: asc };
  }).sort((a, b) => (a.month < b.month ? 1 : -1));
}

export const getMonthWindow = (month: string) => getMonthWindows().find((w) => w.month === month);

const cache = new Map<string, MonthEntry[]>();

/**
 * Top repos by stars gained over one month's window. A repo missing from the baseline counts from 0
 * if it was created on GitHub inside the window (all its stars are new), otherwise from the first
 * snapshot in the month that has it (a conservative undercount).
 */
export function getMonthTop(month: string, limit = 25): MonthEntry[] {
  const w = getMonthWindow(month);
  if (!w) return [];
  if (!cache.has(month)) {
    const base = readSnapshot(w.baseline), end = readSnapshot(w.to);
    const snaps = w.days.map((d) => readSnapshot(d));
    const byName = new Map(getRepos().map((r) => [r.fullName, r]));
    const daysInTop = new Map<string, number>(), daysAtOne = new Map<string, number>();
    for (const d of w.days) getDailyTop(d).forEach((e, i) => {
      daysInTop.set(e.fullName, (daysInTop.get(e.fullName) ?? 0) + 1);
      if (i === 0) daysAtOne.set(e.fullName, (daysAtOne.get(e.fullName) ?? 0) + 1);
    });
    const rows: MonthEntry[] = [];
    for (const [fullName, stars] of Object.entries(end)) {
      if (isExcludedName(fullName)) continue;
      const repo = byName.get(fullName);
      let from: number | undefined = base[fullName];
      const newThisMonth = !!repo?.createdAt && repo.createdAt.slice(0, 10) >= w.from;
      if (from === undefined) from = newThisMonth ? 0 : snaps.find((s) => s[fullName] !== undefined)?.[fullName];
      if (from === undefined) continue;
      const gained = stars - from;
      if (gained > 0) rows.push({ fullName, stars, gained, repo, newThisMonth, daysInTop: daysInTop.get(fullName) ?? 0, daysAtOne: daysAtOne.get(fullName) ?? 0 });
    }
    cache.set(month, rows.sort((a, b) => b.gained - a.gained));
  }
  return cache.get(month)!.slice(0, limit);
}

/** Headline numbers for a month: total gained by its top list, new repos in it, and the repo with the most days at #1. */
export function monthSummary(month: string) {
  const top = getMonthTop(month);
  const total = top.reduce((s, e) => s + e.gained, 0);
  const created = top.filter((e) => e.newThisMonth).length;
  const mostAtOne = [...getMonthTop(month, 1000)].filter((e) => e.daysAtOne > 0).sort((a, b) => b.daysAtOne - a.daysAtOne || b.gained - a.gained)[0];
  return { total, created, mostAtOne };
}
