import { markdownResponse } from "@/lib/agents";
import { getMonthWindows } from "@/lib/monthly";
import { monthlyMarkdown } from "@/lib/monthlyMd";

// Snapshots are read at build time, so every month is prerendered.
export function generateStaticParams() {
  return getMonthWindows().map((w) => ({ month: w.month }));
}

/** Served at /monthly/{YYYY-MM}.md (next.config.ts rewrite). Canonical -> the HTML page, noindexed. */
export async function GET(_req: Request, ctx: { params: Promise<{ month: string }> }) {
  const { month } = await ctx.params;
  if (!getMonthWindows().some((w) => w.month === month)) return new Response("Not an archived month\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const res = markdownResponse(monthlyMarkdown(month), `/monthly/${month}`);
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
