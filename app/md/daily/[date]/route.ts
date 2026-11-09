import { markdownResponse } from "@/lib/agents";
import { getArchiveDays } from "@/lib/daily";
import { dailyMarkdown } from "@/lib/dailyMd";

// Snapshots are read from disk at build time, so every archived day is prerendered.
export function generateStaticParams() {
  return getArchiveDays().map((date) => ({ date }));
}

/**
 * Served at /daily/{YYYY-MM-DD}.md (proxy.ts rewrites it here). Canonical points at the HTML page
 * and the response is noindexed so search engines keep one URL per day.
 */
export async function GET(_req: Request, ctx: RouteContext<"/md/daily/[date]">) {
  const { date } = await ctx.params;
  if (!getArchiveDays().includes(date)) return new Response("Not an archived day\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const res = markdownResponse(dailyMarkdown(date), `/daily/${date}`);
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
