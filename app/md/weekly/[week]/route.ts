import { markdownResponse } from "@/lib/agents";
import { getWeekWindows } from "@/lib/weekly";
import { weeklyMarkdown } from "@/lib/weeklyMd";

// Snapshots are read at build time, so every week is prerendered.
export function generateStaticParams() {
  return getWeekWindows().map((w) => ({ week: w.week }));
}

/** Served at /weekly/{YYYY-Www}.md (next.config.ts rewrite). Canonical -> the HTML page, noindexed. */
export async function GET(_req: Request, ctx: { params: Promise<{ week: string }> }) {
  const { week } = await ctx.params;
  if (!getWeekWindows().some((w) => w.week === week)) return new Response("Not an archived week\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const res = markdownResponse(weeklyMarkdown(week), `/weekly/${week}`);
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
