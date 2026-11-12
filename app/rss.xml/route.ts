import { getData, rankRepos } from "@/lib/data";
import { rssResponse } from "@/lib/rss";
import { SITE } from "@/lib/site";

export function GET() {
  return rssResponse({
    title: `${SITE.name}: fastest-rising repos today`,
    selfPath: "/rss.xml",
    linkPath: "/",
    description: SITE.tagline,
    repos: rankRepos(getData().repos, "today").slice(0, 50),
  });
}
