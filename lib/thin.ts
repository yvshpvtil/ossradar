import { getDetails } from "./details";
import type { Repo } from "./types";

/** A repo page is "thin" when we have no description, no README-derived details and under 2 days of star history. Thin pages are noindexed and left out of the sitemap. */
export function isThinRepo(r: Repo): boolean {
  if (r.description?.trim()) return false;
  const d = getDetails(r.fullName);
  if (d && (d.readmeSummary || d.whoItsFor || d.useCases.length)) return false;
  return r.history.length < 2;
}
