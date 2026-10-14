import raw from "../data/blurbs.json";

/** Hand-checked or LLM-written English one-liners (data/blurbs.json), refreshed with `npm run blurbs`. */
export type BlurbOverride = { text: string; basis: string; source: string; generatedAt: string };
const overrides = raw as Record<string, BlurbOverride>;

export function getBlurbOverride(fullName: string | undefined): string | null {
  return (fullName && overrides[fullName]?.text) || null;
}
