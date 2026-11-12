import { CATEGORIES, getCategory } from "@/lib/categories";
import { getReposByCategory, rankRepos } from "@/lib/data";
import { rssResponse } from "@/lib/rss";
import { SITE } from "@/lib/site";

// Category data is read from disk at build time (rebuilt hourly), so every feed is prerendered.
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

/** Per-category RSS: /category/{slug}/rss.xml, advertised by <link rel=alternate> on the category hub. */
export async function GET(_req: Request, ctx: RouteContext<"/category/[slug]/rss.xml">) {
  const { slug } = await ctx.params;
  const category = getCategory(slug);
  if (!category) return new Response("Not a category\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  // "Coding agents" reads as "coding agents" mid-sentence; acronym-led labels (AI agents, MCP) keep their case.
  const label = /^[A-Z][a-z]/.test(category.label) ? category.label[0].toLowerCase() + category.label.slice(1) : category.label;
  return rssResponse({
    title: `${SITE.name}: fastest-rising ${label} repos`,
    selfPath: `/category/${category.slug}/rss.xml`,
    linkPath: `/category/${category.slug}`,
    description: `The fastest-rising ${label} repos on GitHub today, ranked by stars gained in 24 hours. Updated hourly by ${SITE.name}.`,
    repos: rankRepos(getReposByCategory(category.slug), "today").slice(0, 30),
  });
}
