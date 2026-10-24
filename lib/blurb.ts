/** Short, clean one-line repo descriptions for lists and the newsletter. */
import { getBlurbOverride } from "./blurbOverrides";
import { stripWhy } from "./why";

export const BLURB_MAX = 140;

const CJK = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/g;

/** Text produced by our template summarizer when a repo had no description ("X project in Y. Why it matters: …"). */
export function isPlaceholder(text: string | null | undefined): boolean {
  return !text || /^[\w#+. -]* ?project in [\w /&-]+\.\s*Why it matters:/i.test(text.trim());
}

/** Drop the template's trailing "Why it matters: …" so only the "what it is" part remains. */
export { stripWhy } from "./why";

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
export const cjkRatio = (s: string) => (s.match(CJK)?.length ?? 0) / Math.max(1, s.replace(/\s/g, "").length);

// Words that show an English fragment is a phrase ("a plugin for X"), not a list of names left over
// after dropping the CJK around them ("SceneScript Windows macOS", "LangGraph Coze Dify MCP skills LLM RAG").
const PHRASE_WORD = /\b(?:a|an|the|for|to|of|with|and|or|in|on|by|from|into|via|as|at|is|are|your|you|that|it)\b/i;
const looksLikePhrase = (s: string) => PHRASE_WORD.test(s) || (s.match(/[A-Za-z][\w'’.+#-]*/g)?.length ?? 0) >= 8;

/** If text mixes CJK and an English part, keep the English sentences (when there are enough of them and they read as a phrase). */
export function preferEnglish(text: string): string {
  if (cjkRatio(text) < 0.05) return text;
  const parts = text.split(/(?<=[.!?])\s+|(?<=[。！？])\s*|\s+[|/]\s+|\s+[-–—]\s+(?=[A-Z])/).map((p) => p.trim()).filter(Boolean);
  const english = parts.filter((p) => cjkRatio(p) < 0.05 && /[a-z]{3,}/i.test(p)).join(" ").replace(/^[\s·|•:;,\-–—]+/, "");
  return english.replace(/[^a-z]/gi, "").length >= 20 && looksLikePhrase(english) ? english : text;
}

/** Cap at `max` chars, cutting at the last sentence end if one is reasonably late, else at a word boundary + "…". */
export function cap(text: string, max = BLURB_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const sentence = Math.max(...[". ", "! ", "? ", "。"].map((p) => cut.lastIndexOf(p)));
  if (sentence >= max * 0.5) return cut.slice(0, sentence + 1).trim();
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > max * 0.5 ? space : max).replace(/[\s,;:.\-–—(]+$/, "")}…`;
}

// Unicode emoji runs (pictographs plus variation selector, ZWJ, skin tones, keycaps). (c), (r) and (tm) signs are
// Extended_Pictographic too but are part of names ("Redis®"), so they stay. The collector already strips emoji
// from stored one-liners; this keeps lines rebuilt from the raw GitHub description consistent with them.
const EMOJI_RUN = /(?:(?![\u00A9\u00AE\u2122])\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D\u20E3])+/gu;

/** Drop decorative emoji. One sitting between a word and a capitalized word ("agency 🔥 A Claude Code skill") marked a sentence break. */
export function stripEmoji(text: string): string {
  if (!text.match(EMOJI_RUN)) return text;
  return text
    .replace(new RegExp(`(?<=[\\p{L}\\p{N})])\\s*(?:${EMOJI_RUN.source})\\s+(?=\\p{Lu})`, "gu"), ". ")
    .replace(new RegExp(`\\s*(?:${EMOJI_RUN.source})\\s*(?=[.,;:!?])`, "gu"), "") // "alerts 🎯." -> "alerts."
    .replace(EMOJI_RUN, " ")
    .replace(/^[\s·|•:;,\-–—]+/, "");
}

/** Full cleanup of a free-text description: whitespace, emoji, English preference, length cap. */
export function cleanBlurb(text: string | null | undefined, max = BLURB_MAX): string | null {
  if (!text) return null;
  let t = collapse(stripEmoji(text.replace(/:[a-z0-9_+-]+:/gi, " "))); // GitHub :emoji: shortcodes and Unicode emoji
  t = collapse(preferEnglish(t));
  if (t.replace(/[^\p{L}\p{N}]/gu, "").length < 8) return null;
  return cap(t, max);
}

/** Best one-liner from repo fields: GitHub description, else our summary (unless it's the empty-description placeholder). */
export function repoBlurb(r: { fullName?: string; description?: string | null; oneLiner?: string | null }, max = BLURB_MAX): string | null {
  const o = getBlurbOverride(r.fullName);
  if (o) return cap(o, max);
  return cleanBlurb(r.description, max) ?? (isPlaceholder(r.oneLiner) || !r.oneLiner ? null : cleanBlurb(stripWhy(r.oneLiner ?? ""), max));
}

/** First real prose paragraph of a README (skips headings, badges, images, HTML, code, tables, link lists). */
export function readmeBlurb(markdown: string, max = BLURB_MAX): string | null {
  const text = markdown.replace(/<!--[\s\S]*?-->/g, "").replace(/```[\s\S]*?```/g, "");
  for (const block of text.split(/\n\s*\n/)) {
    const b = block.trim();
    if (!b || /^(#|>|\||[-*+] |\d+\. |<|!\[|\[!\[)/.test(b)) continue;
    const plain = b
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_`~]/g, "");
    const words = plain.match(/[A-Za-z]{2,}/g)?.length ?? 0;
    if (words < 6 && cjkRatio(plain) < 0.3) continue;
    if (/:\s*$/.test(plain.trim())) continue; // lead-in to a list or code block, not a description
    const c = cleanBlurb(plain, max);
    if (c) return c;
  }
  return null;
}

/** A line that should get an English override: mostly CJK, or a README fragment that starts mid-thought. */
export function needsOverride(text: string | null | undefined): boolean {
  if (!text) return true;
  return cjkRatio(text) > 0.05 || /^(It|That|This|These|They|Then|And|But|So|Also|Here|There)\b/.test(text.trim());
}
