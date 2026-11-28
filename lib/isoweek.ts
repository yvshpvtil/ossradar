/** ISO 8601 weeks (Monday to Sunday, UTC). Shared by lib/weekly.ts and proxy.ts, so no data imports here. */

const DAY = 86_400_000;
const at = (d: string) => Date.parse(d + "T00:00:00Z");
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** The Monday (YYYY-MM-DD) of the ISO week containing a UTC date. */
export const weekMonday = (d: string) => iso(at(d) - (((new Date(at(d)).getUTCDay() || 7) - 1) * DAY));

/** ISO week key for a UTC date, e.g. "2026-W48". The week's Thursday decides the year. */
export function isoWeekKey(d: string): string {
  const thu = at(weekMonday(d)) + 3 * DAY;
  const y = new Date(thu).getUTCFullYear();
  const w = Math.floor((thu - Date.UTC(y, 0, 1)) / DAY / 7) + 1;
  return `${y}-W${String(w).padStart(2, "0")}`;
}

/** URL-safe pattern for a week key (canonical form uses an uppercase W). */
export const WEEK_RE = /^(\d{4})-[wW](\d{2})$/;
