import { CATEGORIES, categoryLabel } from "./categories";
import { type DailyEntry, getArchiveDays, getDailyTop } from "./daily";
import { getData, getReposByCategory, rankRepos } from "./data";
import { formatDelta, formatNumber } from "./format";
import { LANDINGS } from "./landing";
import { NEW_DAYS, getNewRepos } from "./newRepos";
import { getLanguages } from "./languages";
import { getRecentHn } from "./mentions";
import { SITE } from "./site";
import { TOPIC_MIN, getTopics, topicLabel } from "./topics";
import type { Repo } from "./types";
import { dropTemplateWhy } from "./whyNotes";

const llmsBlurb = (r: Repo) => dropTemplateWhy(r.oneLiner);

/** One repo row. `withCategory` names the category where the section heading doesn't (mixed top-10 lists). */
const line = (r: Repo, withCategory = false) =>
  `- [${r.fullName}](${SITE.url}/repo/${r.owner}/${r.name}): ${llmsBlurb(r)} (${withCategory ? `${categoryLabel(r.category)}; ` : ""}${formatNumber(r.stars)} stars, ${formatDelta(r.delta24h)} in 24h, ${formatDelta(r.delta7d)} in 7d${r.velocityEstimated ? ", early estimate" : ""})`;

const DAILY_MAX = 14;

/**
 * One line per recent archived day (newest first): the day's top 3 gainers and the list's combined gain, so a crawler or
 * assistant asked "what was trending on GitHub on <date>" finds the dated archive page instead of only a URL pattern.
 */
function dailySection(days: string[]): string {
  const name = (e: DailyEntry) => (e.repo ? `[${e.fullName}](${SITE.url}/repo/${e.repo.owner}/${e.repo.name})` : e.fullName);
  const rows = days.slice(0, DAILY_MAX).flatMap((date) => {
    const top = getDailyTop(date);
    if (!top.length) return [];
    const total = top.reduce((sum, e) => sum + e.gained, 0);
    const lead = top.slice(0, 3).map((e, i) => `#${i + 1} ${name(e)} ${formatDelta(e.gained)}`).join(", ");
    return [`- [${date}](${SITE.url}/daily/${date}): ${lead}; the top ${top.length} gained ${formatNumber(total)} stars combined`];
  });
  if (!rows.length) return "";
  const more = days.length > DAILY_MAX ? ` (latest ${DAILY_MAX} of ${days.length}; all in the [daily archive](${SITE.url}/daily))` : "";
  return `## Daily archive

Top gainers per completed UTC day, newest first${more}:

${rows.join("\n")}

`;
}

/** Category hub rows with the same numbers /category shows: repo count, combined 7-day gain and this week's leading repo. */
function categoryLines(): string {
  return CATEGORIES.map((c) => {
    const repos = getReposByCategory(c.slug);
    const base = `- [${c.label}](${SITE.url}/category/${c.slug}): ${c.description}`;
    if (!repos.length) return base;
    const week = repos.reduce((n, r) => n + r.delta7d, 0);
    const lead = rankRepos(repos, "week")[0];
    const leadText = lead ? `; this week's leader: [${lead.fullName}](${SITE.url}/repo/${lead.owner}/${lead.name}), ${formatDelta(lead.delta7d)}` : "";
    return `${base} (${repos.length} repos, ${formatDelta(week)} stars combined in 7d${leadText})`;
  }).join("\n");
}

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
- [New repos](${SITE.url}/new): tracked repos created on GitHub in the last ${NEW_DAYS} days, grouped by launch day
- [Daily archive](${SITE.url}/daily): one page per UTC day with that day's top gainers
- [Hacker News mentions](${SITE.url}/hacker-news): tracked repos discussed on Hacker News
- [Compare repos](${SITE.url}/compare): side-by-side stars, growth, forks, releases and Hacker News discussion for up to 3 tracked repos
- [Submit a repo](${SITE.url}/submit): suggest an open-source AI or developer-tool repo to track (free, reviewed by hand)
- [Open-source alternatives](${SITE.url}/alternatives): every alternatives page, grouped by category
- [Categories](${SITE.url}/category): every category hub with its repo count and this week's leading repo
- [GitHub topics](${SITE.url}/topic): every topic hub with its repo count and this week's leading repo
- [Programming languages](${SITE.url}/language): every language hub with its repo count and this week's leading repo
- [About and methodology](${SITE.url}/about)
- [Daily newsletter](${SITE.url}/#subscribe): the top 10 rising repos in one email every day; free, unsubscribe anytime
- [Sponsor OSS Radar](${SITE.url}/sponsor): one sponsor per week across the site and the daily newsletter, labeled as a sponsor; sponsorships never affect rankings
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

${categoryLines()}

## Topic hubs

GitHub topics used by at least ${TOPIC_MIN} tracked repos, most used first (singular and plural spellings share one page):

${getTopics().map((t) => `- [${topicLabel(t.slug)}](${SITE.url}/topic/${t.slug}): ${t.count} repos`).join("\n")}

## Languages

${getLanguages().map((l) => `- [${l.name}](${SITE.url}/language/${l.slug}): ${l.count} repos`).join("\n")}

${dailySection(days)}## Data access

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

${top.map((r) => line(r, true)).join("\n")}

## Top 10 by stars gained in the last 7 days

${week.map((r) => line(r, true)).join("\n")}
${newSection()}${hnSection()}`;
}

const HN_DAYS = 30;

/** Tracked repos with the most-upvoted Hacker News stories in the last HN_DAYS days, matching /hacker-news, so "which GitHub repos are on Hacker News" has an answer. */
function hnSection(): string {
  const byName = new Map(getData().repos.map((r) => [r.fullName, r]));
  const rows = getRecentHn(HN_DAYS, Date.parse(getData().generatedAt))
    .flatMap(({ fullName, m }) => {
      const r = byName.get(fullName);
      return r && m.top ? [{ r, top: m.top }] : [];
    })
    .slice(0, 10);
  if (!rows.length) return "";
  return `
## Top 10 tracked repos on Hacker News (last ${HN_DAYS} days) by story points

All Hacker News mentions: [Hacker News](${SITE.url}/hacker-news)

${rows
  .map(
    ({ r, top }) =>
      `- [${r.fullName}](${SITE.url}/repo/${r.owner}/${r.name}): ${llmsBlurb(r)} (HN story "${top.title.replace(/"/g, "'")}" on ${top.date.slice(0, 10)}: ${formatNumber(top.points)} points, ${formatNumber(top.comments)} comments, https://news.ycombinator.com/item?id=${top.id}; ${formatNumber(r.stars)} stars, ${formatDelta(r.delta7d)} in 7d)`,
  )
  .join("\n")}
`;
}

/** The fastest-rising repos created on GitHub in the last NEW_DAYS days, so "what new AI repos launched this week" has an answer. */
function newSection(): string {
  const fresh = rankRepos(getNewRepos().flatMap((g) => g.repos), "week").slice(0, 10);
  if (!fresh.length) return "";
  return `
## Top 10 new repos (created in the last ${NEW_DAYS} days) by 7-day star gain

All new repos, grouped by launch day: [New repos](${SITE.url}/new)

${fresh.map((r) => `${line(r, true).slice(0, -1)}; created ${r.createdAt.slice(0, 10)})`).join("\n")}
`;
}

export function llmsFullTxt(): string {
  const parts = [header()];
  for (const c of CATEGORIES) {
    const repos = rankRepos(getReposByCategory(c.slug), "week");
    if (!repos.length) continue;
    parts.push(`## ${categoryLabel(c.slug)} (${repos.length} repos, ranked by 7-day star gain)\n\n${repos.map((r) => line(r)).join("\n")}\n`);
  }
  return parts.join("\n");
}

export const textResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=600, s-maxage=3600" } });
