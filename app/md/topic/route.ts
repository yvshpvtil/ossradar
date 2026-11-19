import { markdownResponse } from "@/lib/agents";
import { topicIndexMarkdown } from "@/lib/hubIndexMd";

/**
 * Served at /topic.md (next.config.ts rewrites it here; proxy.ts also serves it at /topic for
 * Accept: text/markdown). Built from disk at build time (rebuilt hourly). Canonical points at the
 * HTML index and the response is noindexed.
 */
export async function GET() {
  const res = markdownResponse(topicIndexMarkdown(), "/topic");
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
