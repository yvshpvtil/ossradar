import { categoryLabel } from "@/lib/categories";
import { getData, rankRepos, type Period } from "@/lib/data";
import { SITE } from "@/lib/site";

/**
 * Free public JSON feed of the current leaderboard. Static (regenerated each deploy, i.e. hourly).
 * GET /api/v1/trending  -> top 100 by stars gained in the last 24h, plus 7-day figures.
 */
export function GET() {
  const data = getData();
  const period: Period = "today";
  const repos = rankRepos(data.repos, period).slice(0, 100).map((r, i) => ({
    rank: i + 1,
    fullName: r.fullName,
    url: r.url,
    ossradarUrl: `${SITE.url}/repo/${r.owner}/${r.name}`,
    description: r.description,
    language: r.language,
    category: categoryLabel(r.category),
    topics: r.topics,
    stars: r.stars,
    forks: r.forks,
    starsGained24h: r.delta24h,
    starsGained7d: r.delta7d,
    estimated: r.velocityEstimated,
    createdAt: r.createdAt,
    pushedAt: r.pushedAt,
  }));
  return Response.json(
    {
      source: SITE.url,
      license: "Free to use with a link back to ossradar.net",
      generatedAt: data.generatedAt,
      rankedBy: "stars gained in the last 24 hours",
      count: repos.length,
      repos,
    },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=600, s-maxage=600" } },
  );
}
