import { cleanBlurb, isPlaceholder, stripWhy } from "./blurb";
import { getDetails } from "./details";
import { getBlurbOverride } from "./blurbOverrides";
import type { Repo } from "./types";
import { WHY } from "./whyNotes";
import { snippetText } from "./seo";

const TEMPLATE_WHYS = new Set(Object.values(WHY));

/**
 * Site-side cleanup of stored one-liners (older data predates the cleaner collector):
 * cleans the "what it is" part (English preferred, whitespace, 140-char cap) and keeps the
 * "Why it matters" note. Placeholder lines for repos with no description use the README's
 * first paragraph from data/details when available.
 */
export function cleanOneLiner(r: Pick<Repo, "fullName" | "description" | "oneLiner" | "category">): string {
  let why = r.oneLiner.match(/\s*(Why it matters:.*)$/i)?.[1] ?? "";
  // A stored template note reflects the category at collect time; follow the current categorizer.
  const note = why.match(/^Why it matters:\s*(.*?)\.?$/i)?.[1];
  if (note && TEMPLATE_WHYS.has(note) && WHY[r.category] !== note) why = `Why it matters: ${WHY[r.category]}.`;
  let what: string | null = getBlurbOverride(r.fullName);
  if (what) {
    // English override from data/blurbs.json wins.
  } else if (isPlaceholder(r.oneLiner)) {
    what = cleanBlurb(getDetails(r.fullName)?.readmeSummary);
    if (!what) return r.oneLiner;
  } else {
    // Template lines ("<description>. Why it matters: …") are rebuilt from the full description,
    // since the stored copy was cut before cleaning; LLM lines are cleaned as-is.
    what = why ? cleanBlurb(r.description) ?? cleanBlurb(stripWhy(r.oneLiner)) : cleanBlurb(r.oneLiner);
    if (!what) return r.oneLiner;
  }
  // Drop GitHub-description link clutter (bare URLs, Discord plugs, decorative lead symbols,
  // wrapping quotes) from visible blurbs too; overrides are already clean.
  if (!getBlurbOverride(r.fullName)) what = snippetText(what) || what;
  if (!/[.!?…。]$/.test(what)) what += ".";
  return why ? `${what} ${why}` : what;
}
