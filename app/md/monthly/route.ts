import { markdownResponse } from "@/lib/agents";
import { monthlyIndexMarkdown } from "@/lib/monthlyMd";

/** Served at /monthly.md (next.config.ts rewrite). Canonical -> /monthly, noindexed. */
export async function GET() {
  const res = markdownResponse(monthlyIndexMarkdown(), "/monthly");
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
