import { markdownResponse } from "@/lib/agents";
import { alternativesPath, getAlternativesRepos, getRepo, hasAlternativesPage } from "@/lib/alternatives";
import { alternativesMarkdown } from "@/lib/alternativesMd";

// Alternatives are computed from data read at build time (rebuilt hourly), so every page is prerendered.
export function generateStaticParams() {
  return getAlternativesRepos().map((r) => ({ owner: r.owner, name: r.name }));
}

/**
 * Served at /alternatives/{owner}/{name}.md (proxy.ts rewrites it here). Canonical points at the
 * HTML page and the response is noindexed so search engines keep one URL per alternatives page.
 */
export async function GET(_req: Request, ctx: RouteContext<"/md/alternatives/[owner]/[name]">) {
  const { owner, name } = await ctx.params;
  const r = getRepo(owner, name);
  if (!r || !hasAlternativesPage(r)) return new Response("No alternatives page for this repo\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const res = markdownResponse(alternativesMarkdown(r), alternativesPath(r));
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
