/**
 * The template summarizer appends a generic "Why it matters: …" note to one-liners.
 * It stays on individual repo pages but is dropped from list/leaderboard rows.
 * Kept import-free so client components can use it without pulling in data files.
 */
export function stripWhy(text: string | null | undefined): string {
  return (text ?? "").replace(/\s*Why it matters:[\s\S]*$/i, "").trim();
}
