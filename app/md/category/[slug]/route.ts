import { markdownResponse } from "@/lib/agents";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { categoryMarkdown } from "@/lib/categoryMd";

// Category data is read from disk at build time (rebuilt hourly), so every hub is prerendered.
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

/**
 * Served at /category/{slug}.md (proxy.ts rewrites it here). Canonical points at the HTML hub
 * and the response is noindexed so search engines keep one URL per category.
 */
export async function GET(_req: Request, ctx: RouteContext<"/md/category/[slug]">) {
  const { slug } = await ctx.params;
  const category = getCategory(slug);
  if (!category) return new Response("Not a category\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const res = markdownResponse(categoryMarkdown(category), `/category/${slug}`);
  res.headers.set("X-Robots-Tag", "noindex, follow");
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}
