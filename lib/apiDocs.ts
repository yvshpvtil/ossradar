import { categoryLabel } from "@/lib/categories";
import { getData, getRepos, rankRepos } from "@/lib/data";
import { SITE } from "@/lib/site";

/**
 * Shared content for the developer docs page (/developers) and its Markdown twin (/developers.md):
 * GitHub itself has no trending API, so "GitHub trending API" / "trending repos JSON" searches and
 * agents asked "is there an API for trending GitHub repos?" land here. Same facts as the OpenAPI
 * spec (/api/v1/openapi.json); example values come from the current data (rebuilt hourly).
 */
export const API_BASE = `${SITE.url}/api/v1`;

export type Field = { name: string; type: string; about: string };

export const TRENDING_FIELDS: Field[] = [
  { name: "generatedAt", type: "string (ISO 8601, UTC)", about: "When the data was collected from GitHub. Cite it with any number." },
  { name: "count", type: "integer", about: "Number of repos in repos (up to 100)." },
  { name: "repos[].rank", type: "integer", about: "1 = most stars gained in the last 24 hours." },
  { name: "repos[].fullName", type: "string", about: "owner/name as on GitHub." },
  { name: "repos[].url", type: "string", about: "GitHub URL." },
  { name: "repos[].ossradarUrl / markdownUrl", type: "string", about: `The repo's ${SITE.name} page and its Markdown twin.` },
  { name: "repos[].description", type: "string | null", about: "GitHub description." },
  { name: "repos[].language / category / topics", type: "string | null, string, string[]", about: "Main language, OSS Radar category and GitHub topics." },
  { name: "repos[].stars / forks", type: "integer", about: "Current totals." },
  { name: "repos[].starsGained24h / starsGained7d", type: "integer", about: "Stars gained in the last 24 hours and 7 days." },
  { name: "repos[].estimated", type: "boolean", about: "true when gains are estimated (brand-new repos without enough snapshots yet)." },
  { name: "repos[].createdAt / pushedAt", type: "string (ISO 8601)", about: "Repo creation and last push time." },
];

export const REPO_FIELDS: Field[] = [
  { name: "repo.summary", type: "string | null", about: "Plain-English one-liner of what the project is." },
  { name: "repo.stars / forks / starsGained24h / starsGained7d", type: "integer", about: "Current totals and gains." },
  { name: "repo.rankToday / rankThisWeek", type: "integer", about: "Rank by 24h and 7-day star gain among trackedRepos." },
  { name: "repo.starHistory", type: "array", about: "Daily star counts (date, stars) since tracking began." },
  { name: "repo.hackerNews", type: "object | null", about: "Story count and top Hacker News story (title, points, comments, url)." },
  { name: "repo.alternatives / alternativesUrl", type: "string[], string | null", about: "Similar tracked repos and their alternatives page." },
  { name: "repo.license / homepage / language / category / topics", type: "string | null", about: "Repo metadata." },
  { name: "repo.badgeUrl", type: "string", about: "Live README badge SVG for the repo." },
];

/** A trimmed, real example of each endpoint's response (current data). */
export function apiExamples() {
  const data = getData();
  const top = rankRepos(getRepos(), "today")[0];
  const trending = top
    ? {
        source: SITE.url,
        generatedAt: data.generatedAt,
        rankedBy: "stars gained in the last 24 hours",
        count: 100,
        repos: [
          {
            rank: 1,
            fullName: top.fullName,
            url: top.url,
            ossradarUrl: `${SITE.url}/repo/${top.owner}/${top.name}`,
            language: top.language,
            category: categoryLabel(top.category),
            stars: top.stars,
            starsGained24h: top.delta24h,
            starsGained7d: top.delta7d,
            estimated: top.velocityEstimated,
          },
        ],
      }
    : null;
  return { top, trending, generatedAt: data.generatedAt, tracked: getRepos().length };
}

export const curlTrending = `curl -s ${API_BASE}/trending | jq '.repos[:10][] | {rank, fullName, starsGained24h}'`;
export const pythonTrending = `import requests

data = requests.get("${API_BASE}/trending", timeout=10).json()
for r in data["repos"][:10]:
    print(r["rank"], r["fullName"], f'+{r["starsGained24h"]} stars in 24h')`;
export const jsTrending = `const res = await fetch("${API_BASE}/trending");
const { generatedAt, repos } = await res.json();
console.log(generatedAt, repos.slice(0, 10).map((r) => \`\${r.fullName} +\${r.starsGained24h}\`));`;

export const API_TERMS = [
  "Free, no API key, no sign-up. Please link back to https://ossradar.net where you show the data.",
  "Data refreshes about once an hour (responses are cached for up to 10 minutes); polling more often than every 10 minutes gains nothing.",
  "CORS is open (Access-Control-Allow-Origin: *), so browser apps can call it directly.",
  `Only tracked repos are covered: a curated set of fast-rising open-source AI and developer-tool repos, not all of GitHub. /api/v1/repo/{owner}/{name} answers 404 for repos ${SITE.name} doesn't track.`,
  "Rankings come from GitHub star counts only; sponsorships never change them.",
];

function table(fields: Field[]) {
  return ["| Field | Type | Meaning |", "|---|---|---|", ...fields.map((f) => `| \`${f.name}\` | ${f.type} | ${f.about} |`)];
}

/** Markdown twin of /developers. */
export function apiDocsMarkdown(): string {
  const { top, trending, generatedAt, tracked } = apiExamples();
  const ex = top ? `${top.owner}/${top.name}` : "{owner}/{name}";
  const lines = [
    `# ${SITE.name} API: free JSON for trending GitHub repos`,
    "",
    `GitHub has no official trending API. ${SITE.name} publishes its hourly leaderboard of fast-rising open-source AI and developer-tool repos (${tracked} tracked) as free JSON: no key, no sign-up, open CORS. HTML version: ${SITE.url}/developers`,
    "",
    `Data as of ${generatedAt} (UTC).`,
    "",
    "## Endpoints",
    "",
    `- \`GET ${API_BASE}/trending\`: the top 100 tracked repos ranked by stars gained in the last 24 hours, with 7-day gains, stars, forks, language, category and topics.`,
    `- \`GET ${API_BASE}/repo/{owner}/{name}\`: one tracked repo, e.g. ${API_BASE}/repo/${ex}: stars, 24h and 7-day gains, rank today and this week, daily star history, top Hacker News story, alternatives and badge URL. 404 if not tracked.`,
    `- OpenAPI 3.1 spec: ${API_BASE}/openapi.json (load it as an agent tool or custom GPT action). API catalog (RFC 9727): ${SITE.url}/.well-known/api-catalog`,
    "",
    "## Quick start",
    "",
    "```bash",
    curlTrending,
    "```",
    "",
    "```python",
    pythonTrending,
    "```",
    "",
    "```javascript",
    jsTrending,
    "```",
    "",
    "## /api/v1/trending fields",
    "",
    ...table(TRENDING_FIELDS),
    "",
    "## /api/v1/repo/{owner}/{name} fields",
    "",
    "Same identity, stars, gains and dates as above, plus:",
    "",
    ...table(REPO_FIELDS),
  ];
  if (trending) lines.push("", "## Example response (trimmed, current data)", "", "```json", JSON.stringify(trending, null, 2), "```");
  lines.push(
    "",
    "## Terms and limits",
    "",
    ...API_TERMS.map((t) => `- ${t}`),
    "",
    "## No-code alternatives",
    "",
    `- RSS: ${SITE.url}/rss.xml (hourly top repos), ${SITE.url}/daily/rss.xml (one entry per day)`,
    `- Markdown for LLMs: ${SITE.url}/llms.txt, ${SITE.url}/llms-full.txt, any page with .md appended (e.g. ${SITE.url}/repo/${ex}.md)`,
    `- README badge for maintainers: ${SITE.url}/badge.md`,
    "",
    `Questions or a field you need: ${SITE.sponsorEmail}`,
    "",
  );
  return lines.join("\n");
}
