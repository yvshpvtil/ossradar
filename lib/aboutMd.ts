import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { getArchiveDays } from "@/lib/daily";
import { SITE } from "@/lib/site";

/** About-page FAQ, shared by the HTML page (FAQPage JSON-LD) and its Markdown twin. */
export const ABOUT_FAQ: { q: string; a: string }[] = [
  { q: "What is OSS Radar?", a: `${SITE.name} (OSS = Open-Source Software) is a free, hourly-updated ranking of the fastest-rising open-source AI and developer-tool repositories on GitHub.` },
  { q: "How are repos ranked?", a: "By star velocity: stars gained in the last 24 hours (Today) or the last 7 days (This week), not by total stars. Ties are broken by total stars." },
  { q: "How often is the data updated?", a: "Every hour. A GitHub Action pulls star counts from the GitHub API and the site is rebuilt with the new numbers." },
  { q: "Why are some numbers marked as estimates?", a: "For repos first seen less than 24 hours or 7 days ago there is no earlier snapshot to diff against, so the gain is estimated as total stars divided by days since the repo was created. Measured numbers replace estimates automatically." },
  { q: "Do sponsors affect the rankings?", a: "No. Rankings are computed from GitHub data only. Sponsor placements are clearly labeled and separate from the leaderboard." },
  { q: "Is there an API?", a: "Yes. /api/v1/trending returns the top 100 repos by 24-hour star gain as JSON. For a single tracked repo, /api/v1/repo/{owner}/{name} returns its stars, gains, rank, daily star history and alternatives. Both are free, need no key and update hourly." },
];

/**
 * Markdown twin of /about (/about.md), for chatbots and agents asked "what is OSS Radar" or "how does
 * it rank repos": what it is, the methodology, categories, estimates, data access, FAQ and contact,
 * with the live tracked count and data timestamp (rebuilt hourly).
 */
export function aboutMarkdown(): string {
  const data = getData();
  const days = getArchiveDays();
  const page = `${SITE.url}/about`;
  const lines: string[] = [
    `# About ${SITE.name}: how it ranks rising GitHub repos`,
    "",
    `${SITE.name} (OSS = Open-Source Software) is a free, hourly-updated tracker of the fastest-rising open-source AI and developer-tool repositories on GitHub. Instead of ranking by total stars (which rewards age), it ranks by **star velocity**: stars gained in the last 24 hours and the last 7 days. HTML page: ${page}`,
    "",
    `- Repos tracked right now: ${data.repos.length}`,
    `- Data as of: ${data.generatedAt} (UTC; rebuilt every hour)`,
    ...(days.length ? [`- Daily archive: ${days.length} completed UTC days, ${days[days.length - 1]} to ${days[0]} (${SITE.url}/daily.md)`] : []),
    "",
    "## How it works",
    "",
    `1. Every hour a GitHub Action queries the GitHub Search API for repos created in the last ~90 days around topics like LLM tooling, AI agents, MCP, RAG and vector databases, local LLMs, coding agents and DevOps, plus recently active popular repos in the same space.`,
    "2. It stores an hourly star count for every repo (last 48 hours) and a daily snapshot keyed by UTC date.",
    "3. Star gains are computed by diffing the latest counts against those from 24 hours and 7 days earlier. Ties are broken by total stars.",
    "4. Repos are grouped into categories using their GitHub topics and description, and the site is rebuilt as static pages.",
    "",
    "## Estimates",
    "",
    "Until there are enough snapshots for a repo (first seen less than 24 hours or 7 days ago), its gain is estimated as total stars divided by days since the repo was created, and flagged as an estimate. Measured numbers replace estimates automatically.",
    "",
    "## Categories",
    "",
    ...CATEGORIES.map((c) => `- [${c.label}](${SITE.url}/category/${c.slug}): ${c.description} (Markdown: ${SITE.url}/category/${c.slug}.md)`),
    "",
    "## Sponsorships and independence",
    "",
    `Rankings are computed from GitHub data only; sponsorships never affect them. One sponsor per week appears on the site and in the daily newsletter, clearly labeled as a sponsor (${SITE.url}/sponsor).`,
    "",
    "## Data access for AI agents and developers",
    "",
    `- ${SITE.url}/llms.txt: key pages, URL patterns and current rankings (also ${SITE.url}/llms-full.txt for every tracked repo)`,
    `- ${SITE.url}/agents.md: short agent briefing`,
    `- ${SITE.url}/api/v1/trending: top 100 by 24-hour star gain as JSON (free, no key, hourly)`,
    `- ${SITE.url}/api/v1/repo/{owner}/{name}: one tracked repo's stars, gains, rank, daily history and alternatives as JSON; OpenAPI spec at ${SITE.url}/api/v1/openapi.json`,
    `- ${SITE.url}/index.md and ${SITE.url}/repo/{owner}/{name}.md: the leaderboard and any repo page as Markdown (or send Accept: text/markdown to the HTML URL)`,
    "",
    "## FAQ",
    "",
    ...ABOUT_FAQ.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
    "## Contact",
    "",
    `Built by ${SITE.owner} (${SITE.github}, ${SITE.x}). Email ${SITE.sponsorEmail} for corrections, removal requests, data questions or partnerships. Suggest a repo to track: ${SITE.url}/submit`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
