import { CATEGORIES, categoryLabel } from "./categories";
import { getData, getReposByCategory, rankRepos } from "./data";
import { formatDelta, formatNumber } from "./format";
import { LANDINGS } from "./landing";
import { SITE } from "./site";
import type { Repo } from "./types";

const line = (r: Repo) =>
  `- [${r.fullName}](${SITE.url}/repo/${r.owner}/${r.name}): ${r.oneLiner.replace(/\s+/g, " ")} (${formatNumber(r.stars)} stars, ${formatDelta(r.delta24h)} in 24h, ${formatDelta(r.delta7d)} in 7d${r.velocityEstimated ? ", early estimate" : ""})`;

function header(): string {
  const d = getData();
  return `# ${SITE.name}

> ${SITE.name} (OSS = Open-Source Software) ranks open-source AI and developer-tool GitHub repositories by star velocity: stars gained in the last 24 hours and 7 days, not total stars. It tracks ${d.repos.length} repos and is rebuilt every hour from the GitHub API.

Data as of ${d.generatedAt} (UTC). Star gains come from diffing hourly and daily star-count snapshots; repos first seen less than a week ago have estimated gains (flagged as such). Rankings are computed from GitHub data only; sponsorships never affect them.

## Key pages

- [Leaderboard](${SITE.url}/): all tracked repos ranked by stars gained today or this week
- [New repos](${SITE.url}/new): repos that entered the tracked list recently
- [Daily archive](${SITE.url}/daily): one page per UTC day with that day's top gainers
- [Hacker News mentions](${SITE.url}/hacker-news): tracked repos discussed on Hacker News
- [About and methodology](${SITE.url}/about)
${LANDINGS.map((l) => `- [${l.title}](${SITE.url}/trending/${l.slug}): ${l.description}`).join("\n")}

## Categories

${CATEGORIES.map((c) => `- [${c.label}](${SITE.url}/category/${c.slug}): ${c.description}`).join("\n")}

## Data access

- [JSON API: /api/v1/trending](${SITE.url}/api/v1/trending): top 100 repos by 24h star gain with 7-day gains, stars, forks, language, category, topics. Free, no key, updated hourly; please link back to ${SITE.url}.
- [RSS feed](${SITE.url}/rss.xml)
- [Sitemap](${SITE.url}/sitemap.xml): every repo, category, topic, language and alternatives page
- [Full text for LLMs](${SITE.url}/llms-full.txt): every tracked repo with its one-line summary and current numbers
`;
}

export function llmsTxt(): string {
  const top = rankRepos(getData().repos, "today").slice(0, 10);
  return `${header()}
## Top 10 by stars gained in the last 24 hours

${top.map(line).join("\n")}
`;
}

export function llmsFullTxt(): string {
  const parts = [header()];
  for (const c of CATEGORIES) {
    const repos = rankRepos(getReposByCategory(c.slug), "week");
    if (!repos.length) continue;
    parts.push(`## ${categoryLabel(c.slug)} (${repos.length} repos, ranked by 7-day star gain)\n\n${repos.map(line).join("\n")}\n`);
  }
  return parts.join("\n");
}

export const textResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=600, s-maxage=3600" } });
