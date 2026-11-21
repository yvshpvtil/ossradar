import { markdownResponse } from "@/lib/agents";
import { sponsorMarkdown } from "@/lib/sponsorMd";

/**
 * Served at /sponsor.md (next.config.ts rewrites it here; proxy.ts also serves it at /sponsor for
 * Accept: text/markdown). Built at build time (rebuilt hourly). Canonical points at the HTML page
 * and the response is noindexed.
 */
export async function GET() {
  const res = markdownResponse(sponsorMarkdown(), "/sponsor");
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
