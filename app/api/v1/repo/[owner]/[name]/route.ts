import { alternativesPath, getAlternatives, hasAlternativesPage } from "@/lib/alternatives";
import { categoryLabel } from "@/lib/categories";
import { getData, getRepo, getRepos, rankRepos } from "@/lib/data";
import { getHnMentions } from "@/lib/mentions";
import { SITE } from "@/lib/site";
import { dropTemplateWhy } from "@/lib/whyNotes";

/**
 * Free public JSON for one tracked repo, so agents and chatbots answering "how fast is X growing?"
 * can fetch structured numbers instead of scraping the repo page. Static, one file per tracked repo
 * (regenerated each deploy, i.e. hourly); untracked repos get a JSON 404.
 * GET /api/v1/repo/{owner}/{name}
 */

export function generateStaticParams() {
  return getRepos().map((r) => ({ owner: r.owner, name: r.name }));
}

export async function GET(_req: Request, ctx: RouteContext<"/api/v1/repo/[owner]/[name]">) {
  const { owner, name } = await ctx.params;
  const r = getRepo(owner, name);
  if (!r) return Response.json({ error: "Not a tracked repo" }, { status: 404 });
  const all = getRepos();
  const rankOf = (period: "today" | "week") => rankRepos(all, period).findIndex((x) => x.fullName === r.fullName) + 1;
  const hn = getHnMentions(r.fullName);
  const alts = hasAlternativesPage(r) ? getAlternatives(r).slice(0, 5) : [];
  return Response.json(
    {
      source: SITE.url,
      license: "Free to use with a link back to ossradar.net",
      generatedAt: getData().generatedAt,
      repo: {
        fullName: r.fullName,
        url: r.url,
        ossradarUrl: `${SITE.url}/repo/${r.owner}/${r.name}`,
        markdownUrl: `${SITE.url}/repo/${r.owner}/${r.name}.md`,
        summary: dropTemplateWhy(r.oneLiner) || r.description,
        description: r.description,
        homepage: r.homepage,
        language: r.language,
        license: r.license?.spdx ?? null,
        category: categoryLabel(r.category),
        categoryUrl: `${SITE.url}/category/${r.category}`,
        topics: r.topics,
        stars: r.stars,
        forks: r.forks,
        starsGained24h: r.delta24h,
        starsGained7d: r.delta7d,
        estimated: r.velocityEstimated,
        rankToday: rankOf("today"),
        rankThisWeek: rankOf("week"),
        trackedRepos: all.length,
        createdAt: r.createdAt,
        pushedAt: r.pushedAt,
        starHistory: r.history,
        hackerNews: hn?.top
          ? { stories: hn.count, topStory: { title: hn.top.title, points: hn.top.points, comments: hn.top.comments, date: hn.top.date, url: `https://news.ycombinator.com/item?id=${hn.top.id}` } }
          : null,
        alternativesUrl: alts.length ? `${SITE.url}${alternativesPath(r)}` : null,
        alternatives: alts.map((a) => a.repo.fullName),
        badgeUrl: `${SITE.url}/badge/${r.owner}/${r.name}`,
      },
    },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=600, s-maxage=600" } },
  );
}
