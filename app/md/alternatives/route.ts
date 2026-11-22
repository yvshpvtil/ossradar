import { markdownResponse } from "@/lib/agents";
import { alternativesIndexMarkdown } from "@/lib/alternativesIndexMd";

/**
 * Served at /alternatives.md (next.config.ts rewrites it here; proxy.ts also serves it at /alternatives
 * for Accept: text/markdown). Built from disk at build time (rebuilt hourly). Canonical points at the
 * HTML index and the response is noindexed.
 */
export async function GET() {
  const res = markdownResponse(alternativesIndexMarkdown(), "/alternatives");
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
