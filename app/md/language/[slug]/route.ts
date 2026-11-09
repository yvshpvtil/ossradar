import { markdownResponse } from "@/lib/agents";
import { getLanguage, getLanguages } from "@/lib/languages";
import { languageMarkdown } from "@/lib/languageMd";

// Language data is read from disk at build time (rebuilt hourly), so every hub is prerendered.
export function generateStaticParams() {
  return getLanguages().map((l) => ({ slug: l.slug }));
}

/**
 * Served at /language/{slug}.md (proxy.ts rewrites it here). Canonical points at the HTML hub
 * and the response is noindexed so search engines keep one URL per language.
 */
export async function GET(_req: Request, ctx: RouteContext<"/md/language/[slug]">) {
  const { slug } = await ctx.params;
  const lang = getLanguage(slug);
  if (!lang) return new Response("Not a language hub\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const res = markdownResponse(languageMarkdown(lang), `/language/${slug}`);
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
