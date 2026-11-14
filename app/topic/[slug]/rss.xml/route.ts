import { rankRepos } from "@/lib/data";
import { rssResponse } from "@/lib/rss";
import { SITE } from "@/lib/site";
import { getReposByTopic, getTopics, hasTopicPage, topicLabel } from "@/lib/topics";

// Topic hubs are read from disk at build time (rebuilt hourly), so every feed is prerendered.
export function generateStaticParams() {
  return getTopics().map((t) => ({ slug: t.slug }));
}

/** Per-topic RSS: /topic/{slug}/rss.xml, advertised by <link rel=alternate> on the topic hub. */
export async function GET(_req: Request, ctx: RouteContext<"/topic/[slug]/rss.xml">) {
  const { slug } = await ctx.params;
  if (!hasTopicPage(slug)) return new Response("Not a topic hub\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const label = topicLabel(slug);
  return rssResponse({
    title: `${SITE.name}: fastest-rising ${label} repos`,
    selfPath: `/topic/${slug}/rss.xml`,
    linkPath: `/topic/${slug}`,
    description: `The fastest-rising open-source repos tagged ${label} on GitHub today, ranked by stars gained in 24 hours. Updated hourly by ${SITE.name}.`,
    repos: rankRepos(getReposByTopic(slug), "today").slice(0, 30),
  });
}
