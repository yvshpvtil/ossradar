import { markdownResponse } from "@/lib/agents";
import { getRepo } from "@/lib/data";
import { repoMarkdown } from "@/lib/repoMd";

/**
 * Served at /repo/{owner}/{name}.md (proxy.ts rewrites it here). Canonical points at the HTML page
 * and the internal /md path is noindexed so search engines keep one URL per repo.
 */
export async function GET(_req: Request, ctx: RouteContext<"/md/repo/[owner]/[name]">) {
  const { owner, name } = await ctx.params;
  const r = getRepo(owner, name);
  if (!r) return new Response("Not a tracked repo\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const res = markdownResponse(repoMarkdown(r), `/repo/${r.owner}/${r.name}`);
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
