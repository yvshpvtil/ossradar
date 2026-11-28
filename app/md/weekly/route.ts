import { markdownResponse } from "@/lib/agents";
import { weeklyIndexMarkdown } from "@/lib/weeklyMd";

/** Served at /weekly.md (next.config.ts rewrite). Canonical -> /weekly, noindexed. */
export async function GET() {
  const res = markdownResponse(weeklyIndexMarkdown(), "/weekly");
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
