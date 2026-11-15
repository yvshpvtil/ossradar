import { markdownResponse } from "@/lib/agents";
import { dailyIndexMarkdown } from "@/lib/dailyMd";

/**
 * Served at /daily.md (next.config.ts rewrites it here; proxy.ts also serves it at /daily for
 * Accept: text/markdown). Built from the snapshots at build time (rebuilt hourly). Canonical points
 * at the HTML page and the response is noindexed.
 */
export async function GET() {
  const res = markdownResponse(dailyIndexMarkdown(), "/daily");
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
