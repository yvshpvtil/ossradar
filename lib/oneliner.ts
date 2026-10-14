import { cleanBlurb, isPlaceholder, stripWhy } from "./blurb";
import { getDetails } from "./details";
import type { Repo } from "./types";

/**
 * Site-side cleanup of stored one-liners (older data predates the cleaner collector):
 * cleans the "what it is" part (English preferred, whitespace, 140-char cap) and keeps the
 * "Why it matters" note. Placeholder lines for repos with no description use the README's
 * first paragraph from data/details when available.
 */
export function cleanOneLiner(r: Pick<Repo, "fullName" | "description" | "oneLiner">): string {
  const why = r.oneLiner.match(/\s*(Why it matters:.*)$/i)?.[1] ?? "";
  let what: string | null;
  if (isPlaceholder(r.oneLiner)) {
    what = cleanBlurb(getDetails(r.fullName)?.readmeSummary);
    if (!what) return r.oneLiner;
  } else {
    // Template lines ("<description>. Why it matters: …") are rebuilt from the full description,
    // since the stored copy was cut before cleaning; LLM lines are cleaned as-is.
    what = why ? cleanBlurb(r.description) ?? cleanBlurb(stripWhy(r.oneLiner)) : cleanBlurb(r.oneLiner);
    if (!what) return r.oneLiner;
  }
  if (!/[.!?…。]$/.test(what)) what += ".";
  return why ? `${what} ${why}` : what;
}
