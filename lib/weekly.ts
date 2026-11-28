import { getArchiveDays } from "./daily";
import { formatDate } from "./format";
import { isoWeekKey, weekMonday } from "./isoweek";
import { getPeriodTop, periodSummary, type MonthEntry, type PeriodWindow } from "./monthly";

/**
 * Weekly roundups (/weekly/{YYYY-Www}): which tracked repos gained the most GitHub stars in one ISO
 * week (Monday to Sunday, UTC), from the same daily snapshots as /daily and /monthly. Targets
 * "top GitHub repos this week / week of {date}" searches with permanent, dated, citable pages
 * (the rolling /trending/ai-repos-this-week view changes every hour and keeps no history).
 */

export type WeekWindow = PeriodWindow & { week: string; monday: string; sunday: string; complete: boolean };

const DAY = 86_400_000;
const shift = (d: string, n: number) => new Date(Date.parse(d + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);

/** "Nov 23 – Nov 29, 2026" style range for a week. */
export function weekRange(w: { monday: string; sunday: string }) {
  const a = formatDate(w.monday), b = formatDate(w.sunday);
  return a.slice(-4) === b.slice(-4) ? `${a.slice(0, -6)} – ${b}` : `${a} – ${b}`;
}
/** "week of Nov 23, 2026" */
export const weekLabel = (w: { monday: string }) => `week of ${formatDate(w.monday)}`;

/** Each ISO week with at least one archived day, newest first. A week in progress is "so far". */
export function getWeekWindows(): WeekWindow[] {
  const byWeek = new Map<string, string[]>();
  for (const d of getArchiveDays()) byWeek.set(isoWeekKey(d), [...(byWeek.get(isoWeekKey(d)) ?? []), d]);
  return [...byWeek.entries()].map(([week, ds]) => {
    const days = [...ds].sort();
    const monday = weekMonday(days[0]), sunday = shift(monday, 6);
    const to = days[days.length - 1];
    return { week, monday, sunday, from: days[0], to, baseline: shift(days[0], -1), complete: to === sunday, days };
  }).sort((a, b) => (a.week < b.week ? 1 : -1));
}

export const getWeekWindow = (week: string) => getWeekWindows().find((w) => w.week === week);

export function getWeekTop(week: string, limit = 25): MonthEntry[] {
  const w = getWeekWindow(week);
  return w ? getPeriodTop(`w:${week}`, w, limit) : [];
}

export const weekSummary = (week: string) => periodSummary(getWeekTop(week), getWeekTop(week, 1000));

/** The week a given archived day belongs to (for links from /daily/{date} and /monthly/{month}). */
export const weekOf = (d: string) => isoWeekKey(d);
