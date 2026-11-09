import { markdownResponse } from "@/lib/agents";
import { LANDINGS, getLanding } from "@/lib/landing";
import { trendingMarkdown } from "@/lib/trendingMd";

// Ranking data is read from disk at build time (rebuilt hourly), so every view is prerendered.
export function generateStaticParams() {
  return LANDINGS.map((l) => ({ slug: l.slug }));
}

/**
 * Served at /trending/{slug}.md (proxy.ts rewrites it here). Canonical points at the HTML view
 * and the response is noindexed so search engines keep one URL per view.
 */
export async function GET(_req: Request, ctx: RouteContext<"/md/trending/[slug]">) {
  const { slug } = await ctx.params;
  const landing = getLanding(slug);
  if (!landing) return new Response("Not a trending view\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const res = markdownResponse(trendingMarkdown(landing), `/trending/${slug}`);
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
