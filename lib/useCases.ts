/**
 * Clean the "Who it's for" use-case bullets before they render. Most come from the heuristic
 * README parser, which takes the first line of a feature bullet and cuts it at 140 chars, so some
 * read as fragments: a bare label ("AI Model Selection:", "Guidelines —"), a line-wrapped bullet
 * ending on "plus" or ", ad", or a cut mid-word inside parentheses ("(phone numbers, em").
 * Keep what reads as a complete phrase, end a clipped one at a clean boundary with an ellipsis,
 * and drop what can't be saved (bare labels, one-word headings).
 */

/** Words a complete phrase doesn't end on; a bullet ending on one was wrapped or cut. */
const DANGLING = /\b(?:a|an|the|and|or|plus|with|without|to|of|for|in|on|at|by|from|into|via|like|as|than|that|which|each|every|its|their|your|our|tries|is|are)$/i;

/** Heuristic bullets were cut at exactly this many characters (LLM ones at 160). */
const CUT_LENGTHS = new Set([140, 160]);

const ELLIPSIS = "…";

function unbalanced(s: string): boolean {
  return (s.match(/\(/g)?.length ?? 0) > (s.match(/\)/g)?.length ?? 0);
}

/** Cut back to the last clean boundary: a sentence end, else a comma/dash/semicolon clause, else a word. */
function clip(s: string): string | null {
  let t = s;
  // A bullet wrapped right after punctuation ("…: your apps,") only lost its tail: keep every word.
  if (/[,;&/+]$/.test(t) && !unbalanced(t)) {
    t = t.replace(/[\s,;&/+]+$/, "");
    while (DANGLING.test(t)) t = t.replace(DANGLING, "").replace(/[\s,;:—–-]+$/, "");
    return t.length >= 15 ? `${t}${ELLIPSIS}` : null;
  }
  const sentence = t.match(/^(.*[.!?])\s+\S/);
  if (sentence && sentence[1].length >= 12 && !unbalanced(sentence[1])) return sentence[1];
  if (unbalanced(t)) {
    // An open parenthesis that never closes was cut inside it: drop the parenthetical.
    t = t.slice(0, t.lastIndexOf("(")).trimEnd();
  } else {
    // Drop the last (possibly partial) word, then the clause it hung off if that keeps most of the text.
    t = t.replace(/\s*\S*$/, "");
    const clause = Math.max(t.lastIndexOf(", "), t.lastIndexOf(" — "), t.lastIndexOf(" - "), t.lastIndexOf("; "));
    if (clause >= Math.max(25, t.length * 0.6) && !unbalanced(t.slice(0, clause))) t = t.slice(0, clause);
  }
  t = t.replace(/[\s,;:—–-]+$/, "");
  while (DANGLING.test(t)) t = t.replace(DANGLING, "").replace(/[\s,;:—–-]+$/, "");
  return t.length >= 15 ? `${t}${ELLIPSIS}` : null;
}

export function cleanUseCase(raw: string): string | null {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return null;
  // A label with nothing after it: "AI Model Selection:", "Guidelines —".
  if (/[:—–-]$/.test(s)) return null;
  // One-word headings ("Spaces", "Recording") say nothing on their own.
  if (!/\s/.test(s) && s.length < 20) return null;
  const cut = (CUT_LENGTHS.has(raw.trim().length) && !/[.!?)]$/.test(s)) || unbalanced(s);
  const lastWord = s.match(/(\S+)$/)?.[1] ?? "";
  const dangling = DANGLING.test(s) || /,\s*\S{1,3}$/.test(s) || /[,;(&/+]$/.test(s);
  if (!cut && !dangling) return s;
  // Bullets ending in a lowercase 1-3 letter stub after a comma (", ad", ", em") or a dangling
  // connector were wrapped/cut: clip them. Keep a short final word that is a real token (e.g. "UI").
  if (!cut && /^[A-Z0-9]+$/.test(lastWord)) return s;
  return clip(s);
}

/** Cleaned, de-duplicated use cases (order kept). */
export function cleanUseCases(list: readonly string[] | undefined): string[] {
  const out: string[] = [];
  for (const u of list ?? []) {
    const c = cleanUseCase(u);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}
