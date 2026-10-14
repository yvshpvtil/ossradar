import { getData } from "@/lib/data";
import { toLeaderRepos } from "@/lib/leader";

/** Full leaderboard for the home page, fetched by the client after the first 50 rows are server-rendered. */
export function GET() {
  const data = getData();
  return Response.json(
    { generatedAt: data.generatedAt, repos: toLeaderRepos(data.repos) },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
