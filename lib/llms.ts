import { CATEGORIES, categoryLabel } from "./categories";
import { getArchiveDays } from "./daily";
import { getData, getReposByCategory, rankRepos } from "./data";
import { formatDelta, formatNumber } from "./format";
import { LANDINGS } from "./landing";
import { getLanguages } from "./languages";
import { SITE } from "./site";
import { TOPIC_MIN, getTopics, topicLabel } from "./topics";
import type { Repo } from "./types";

const line = (r: Repo) =>
  `- [${r.fullName}](${SITE.url}/repo/${r.owner}/${r.name}): ${r.oneLiner.replace(/\s+/g, " ")} (${formatNumber(r.stars)} stars, ${formatDelta(r.delta24h)} in 24h, ${formatDelta(r.delta7d)} in 7d${r.velocityEstimated ? ", early estimate" : ""})`;

function header(): string {
  const d = getData();
  const top = rankRepos(d.repos, "today")[0];
  const example = top ? `${SITE.url}/repo/${top.owner}/${top.name}` : `${SITE.url}/repo/{owner}/{name}`;
  const days = getArchiveDays();
  const dailyPattern = days.length
    ? `\n- Daily archive: ${SITE.url}/daily/{YYYY-MM-DD} (one completed UTC day's top gainers; ${days.length} days from ${days[days.length - 1]} to ${days[0]}, e.g. ${SITE.url}/daily/${days[0]})`
    : "";
  return `# ${SITE.name}

> ${SITE.name} (OSS = Open-Source Software) ranks open-source AI and developer-tool GitHub repositories by star velocity: stars gained in the last 24 hours and 7 days, not total stars. It tracks ${d.repos.length} repos and is rebuilt every hour from the GitHub API.

Data as of ${d.generatedAt} (UTC). Star gains come from diffing hourly and daily star-count snapshots; repos first seen less than a week ago have estimated gains (flagged as such). Rankings are computed from GitHub data only; sponsorships never affect them.

## Key pages

- [Leaderboard](${SITE.url}/): all tracked repos ranked by stars gained today or this week
- [New repos](${SITE.url}/new): repos that entered the tracked list recently
- [Daily archive](${SITE.url}/daily): one page per UTC day with that day's top gainers
- [Hacker News mentions](${SITE.url}/hacker-news): tracked repos discussed on Hacker News
- [Compare repos](${SITE.url}/compare): side-by-side stars, growth, forks, releases and Hacker News discussion for up to 3 tracked repos
- [Submit a repo](${SITE.url}/submit): suggest an open-source AI or developer-tool repo to track (free, reviewed by hand)
- [Open-source alternatives](${SITE.url}/alternatives): every alternatives page, grouped by category
- [Categories](${SITE.url}/category): every category hub with its repo count and this week's leading repo
- [GitHub topics](${SITE.url}/topic): every topic hub with its repo count and this week's leading repo
- [Programming languages](${SITE.url}/language): every language hub with its repo count and this week's leading repo
- [About and methodology](${SITE.url}/about)
${LANDINGS.map((l) => `- [${l.title}](${SITE.url}/trending/${l.slug}): ${l.description}`).join("\n")}

## URL patterns

Use these to link straight to a tracked repo (owner and name exactly as on GitHub, e.g. ${example}):

- Repo page: ${SITE.url}/repo/{owner}/{name} (stars, 24h and 7-day gains, star history, latest release, Hacker News mentions)
- Alternatives: ${SITE.url}/alternatives/{owner}/{name} (tracked repos in the same category sharing its GitHub topics; only for repos with at least 3)
- Compare: ${SITE.url}/compare?r={owner}/{name},{owner}/{name} (up to 3 tracked repos)
- By language: ${SITE.url}/language/{language}, e.g. ${SITE.url}/language/python (only the languages listed below have a page)
- By GitHub topic: ${SITE.url}/topic/{topic}, e.g. ${SITE.url}/topic/mcp (only the topics listed below have a page)
- README badge (SVG): ${SITE.url}/badge/{owner}/{name}${dailyPattern}

## Categories

${CATEGORIES.map((c) => `- [${c.label}](${SITE.url}/category/${c.slug}): ${c.description}`).join("\n")}

## Topic hubs

GitHub topics used by at least ${TOPIC_MIN} tracked repos, most used first (singular and plural spellings share one page):

${getTopics().map((t) => `- [${topicLabel(t.slug)}](${SITE.url}/topic/${t.slug}): ${t.count} repos`).join("\n")}

## Languages

${getLanguages().map((l) => `- [${l.name}](${SITE.url}/language/${l.slug}): ${l.count} repos`).join("\n")}

## Data access

- [JSON API: /api/v1/trending](${SITE.url}/api/v1/trending): top 100 repos by 24h star gain with 7-day gains, stars, forks, language, category, topics. Free, no key, updated hourly; please link back to ${SITE.url}.
- [RSS feed](${SITE.url}/rss.xml)
- [Sitemap](${SITE.url}/sitemap.xml): every repo, category, topic, language and alternatives page
- [Full text for LLMs](${SITE.url}/llms-full.txt): every tracked repo with its one-line summary and current numbers
`;
}

export function llmsTxt(): string {
  const repos = getData().repos;
  const top = rankRepos(repos, "today").slice(0, 10);
  const week = rankRepos(repos, "week").slice(0, 10);
  return `${header()}
## Top 10 by stars gained in the last 24 hours

${top.map(line).join("\n")}

## Top 10 by stars gained in the last 7 days

${week.map(line).join("\n")}
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
