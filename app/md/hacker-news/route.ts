import { markdownResponse } from "@/lib/agents";
import { hackerNewsMarkdown } from "@/lib/hnMd";

/**
 * Served at /hacker-news.md (next.config.ts rewrites it here). Built from disk at build time
 * (rebuilt hourly). Canonical points at the HTML page and the response is noindexed.
 */
export async function GET() {
  const res = markdownResponse(hackerNewsMarkdown(), "/hacker-news");
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
