import { rankRepos } from "@/lib/data";
import { getLanguage, getLanguages, getReposByLanguage } from "@/lib/languages";
import { rssResponse } from "@/lib/rss";
import { SITE } from "@/lib/site";

// Language hubs are read from disk at build time (rebuilt hourly), so every feed is prerendered.
export function generateStaticParams() {
  return getLanguages().map((l) => ({ slug: l.slug }));
}

/** Per-language RSS: /language/{slug}/rss.xml, advertised by <link rel=alternate> on the language hub. */
export async function GET(_req: Request, ctx: RouteContext<"/language/[slug]/rss.xml">) {
  const { slug } = await ctx.params;
  const lang = getLanguage(slug);
  if (!lang) return new Response("Not a language hub\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return rssResponse({
    title: `${SITE.name}: fastest-rising ${lang.name} repos`,
    selfPath: `/language/${lang.slug}/rss.xml`,
    linkPath: `/language/${lang.slug}`,
    description: `The fastest-rising open-source ${lang.name} AI and developer-tool repos on GitHub today, ranked by stars gained in 24 hours. Updated hourly by ${SITE.name}.`,
    repos: rankRepos(getReposByLanguage(lang.name), "today").slice(0, 30),
  });
}
