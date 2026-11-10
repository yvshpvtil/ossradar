import { altLabel } from "@/lib/alternatives";
import { repoBlurb } from "@/lib/blurb";
import { CATEGORIES } from "@/lib/categories";
import { getArchiveDays } from "@/lib/daily";
import { deltaFor, getData, rankRepos, type Period } from "@/lib/data";
import { LANDINGS } from "@/lib/landing";
import { getNewRepos } from "@/lib/newRepos";
import { SITE } from "@/lib/site";

/** Rows per ranking in the homepage Markdown twin (the HTML leaderboard paginates the rest). */
const TODAY_ROWS = 25;
const WEEK_ROWS = 10;

/**
 * Markdown twin of the homepage leaderboard (/index.md, or Accept: text/markdown on /), for
 * chatbots and agents that fetch the site root: today's and this week's fastest-rising repos
 * in clean text, plus where to go next.
 */
export function homeMarkdown(): string {
  const data = getData();
  const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  const est = (v: boolean) => (v ? " est." : "");
  const link = (r: (typeof data.repos)[number]) => {
    const label = altLabel(r);
    return `[${label}](${SITE.url}/repo/${r.owner}/${r.name})${label !== r.fullName ? ` (${r.fullName})` : ""}`;
  };
  const table = (period: Period, n: number) => {
    const rows = rankRepos(data.repos, period).filter((r) => deltaFor(r, period) > 0).slice(0, n);
    if (rows.length === 0) return ["No gains measured yet."];
    return [
      "| # | Repo | 24 hours | 7 days | Total stars | What it is |",
      "| --- | --- | --- | --- | --- | --- |",
      ...rows.map((r, i) => `| ${i + 1} | ${link(r)} | +${r.delta24h}${est(r.estimated24h)} | +${r.delta7d}${est(r.estimated7d)} | ${r.stars} | ${cell(repoBlurb(r) ?? "")} |`),
    ];
  };
  const newCount = getNewRepos().reduce((n, g) => n + g.repos.length, 0);
  const latestDay = getArchiveDays()[0];
  const lines: string[] = [
    `# ${SITE.name}: trending AI & dev-tool GitHub repos today`,
    "",
    `> ${SITE.metaDescription}`,
    "",
    `${data.repos.length} open-source AI and developer-tool repos tracked, ranked by stars gained. Data as of ${data.generatedAt} (UTC), updated hourly. HTML page: ${SITE.url}/`,
    "",
    `## Fastest-rising today (top ${TODAY_ROWS} by stars gained in the last 24 hours)`,
    "",
    ...table("today", TODAY_ROWS),
    "",
    `## Fastest-rising this week (top ${WEEK_ROWS} by stars gained in the last 7 days)`,
    "",
    ...table("week", WEEK_ROWS),
    "",
    "Gains marked est. are estimates for repos first seen less than a week ago. Each repo also has a Markdown page: append .md to its repo URL.",
    "",
    "## Go deeper (Markdown)",
    "",
    ...LANDINGS.map((l) => `- ${l.title}: ${SITE.url}/trending/${l.slug}.md`),
    `- New repos (${newCount} created in the last 14 days): ${SITE.url}/new.md`,
    `- Hacker News mentions: ${SITE.url}/hacker-news.md`,
    ...(latestDay ? [`- Latest daily top 25 (${latestDay}): ${SITE.url}/daily/${latestDay}.md`] : []),
    "",
    "## Categories",
    "",
    ...CATEGORIES.map((c) => `- ${c.label}: ${SITE.url}/category/${c.slug}.md`),
    "",
    "## More",
    "",
    `- Site guide for LLMs: ${SITE.url}/llms.txt (full data: ${SITE.url}/llms-full.txt)`,
    `- Agent briefing: ${SITE.url}/agents.md`,
    `- JSON API (free, no key): ${SITE.url}/api/v1/trending`,
    "",
    `Free to cite with a link back to ${SITE.url}/.`,
    "",
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
