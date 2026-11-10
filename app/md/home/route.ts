import { markdownResponse } from "@/lib/agents";
import { homeMarkdown } from "@/lib/homeMd";

/**
 * Served at /index.md (next.config.ts rewrites it here) and at / for Accept: text/markdown
 * (proxy.ts). Built from disk at build time (rebuilt hourly). Canonical points at the homepage
 * and the response is noindexed.
 */
export async function GET() {
  const res = markdownResponse(homeMarkdown(), "/");
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
