import { markdownResponse } from "@/lib/agents";
import { getTopics, hasTopicPage } from "@/lib/topics";
import { topicMarkdown } from "@/lib/topicMd";

// Topic data is read from disk at build time (rebuilt hourly), so every hub is prerendered.
export function generateStaticParams() {
  return getTopics().map((t) => ({ slug: t.slug }));
}

/**
 * Served at /topic/{slug}.md (proxy.ts rewrites it here). Canonical points at the HTML hub
 * and the response is noindexed so search engines keep one URL per topic.
 */
export async function GET(_req: Request, ctx: RouteContext<"/md/topic/[slug]">) {
  const { slug } = await ctx.params;
  if (!hasTopicPage(slug)) return new Response("Not a topic hub\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const res = markdownResponse(topicMarkdown(slug), `/topic/${slug}`);
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
