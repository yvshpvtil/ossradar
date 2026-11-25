import { markdownResponse } from "@/lib/agents";
import { apiDocsMarkdown } from "@/lib/apiDocs";

/**
 * Served at /developers.md (next.config.ts rewrites it here; proxy.ts also serves it at /developers
 * for Accept: text/markdown). Built at build time (rebuilt hourly). Canonical points at the HTML page
 * and the response is noindexed.
 */
export async function GET() {
  const res = markdownResponse(apiDocsMarkdown(), "/developers");
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
