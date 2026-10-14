import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * data/sponsors.json: every sponsorship ever booked (past, current, future).
 *   { "name", "url", "tagline", "logo"?: absolute image URL, "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" (inclusive, UTC) }
 * Active = start <= today <= end. Empty file / no active entry = nothing renders.
 * The site rebuilds hourly, so a sponsorship goes live within an hour of its start date.
 */
export interface Sponsor {
  name: string;
  url: string;
  tagline: string;
  logo?: string;
  start: string;
  end: string;
}

export const LAUNCH_PRICE_USD = 49;
export const LAUNCH_SLOTS = 3;
export const REGULAR_PRICE_USD = 99;

export function getSponsors(): Sponsor[] {
  try {
    const raw = JSON.parse(readFileSync(path.join(process.cwd(), "data", "sponsors.json"), "utf8"));
    return Array.isArray(raw) ? raw.filter((s) => s && s.name && s.url && s.tagline && s.start && s.end) : [];
  } catch {
    return [];
  }
}

export function getActiveSponsor(now: Date): Sponsor | null {
  const today = now.toISOString().slice(0, 10);
  return getSponsors().find((s) => s.start <= today && today <= s.end) ?? null;
}

/** Launch pricing: the first LAUNCH_SLOTS sponsorships booked are $49/week, then $99/week. */
export function sponsorPricing() {
  const sold = getSponsors().length;
  const launchLeft = Math.max(0, LAUNCH_SLOTS - sold);
  return { sold, launchLeft, price: launchLeft > 0 ? LAUNCH_PRICE_USD : REGULAR_PRICE_USD };
}
