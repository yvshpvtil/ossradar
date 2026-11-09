import { altLabel } from "@/lib/alternatives";
import { repoBlurb } from "@/lib/blurb";
import { deltaFor, getData } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { LANDINGS, type Landing } from "@/lib/landing";
import { SITE } from "@/lib/site";

/** How many rows the Markdown twin lists (the HTML view paginates the full list client-side). */
const ROWS = 50;

/**
 * Markdown twin of a trending view (/trending/{slug}.md), for chatbots and agents answering
 * "what are the trending AI repos on GitHub this week / today" or "which new AI repos are rising":
 * the same ranking as the HTML view, in clean text.
 */
export function trendingMarkdown(l: Landing): string {
  const period = l.slug === "github-repos-today" ? "today" : "week";
  const windowText = period === "today" ? "the last 24 hours" : "the last 7 days";
  const repos = l.select();
  const rows = repos.slice(0, ROWS);
  const page = `${SITE.url}/trending/${l.slug}`;
  const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  const est = (v: boolean) => (v ? " est." : "");
  const top10 = repos.slice(0, 10).filter((r) => deltaFor(r, period) > 0);
  const lines: string[] = [
    `# ${l.h1}`,
    "",
    `> ${l.description}`,
    "",
    l.intro,
    "",
    `${repos.length} tracked repos in this view, ranked by stars gained in ${windowText}${repos.length > ROWS ? `; the top ${ROWS} are listed here` : ""}. Data from ${SITE.name} as of ${getData().generatedAt} (UTC), updated hourly. HTML page: ${page}`,
  ];
  if (top10.length) {
    const lead = top10[0];
    const total = top10.reduce((n, r) => n + deltaFor(r, period), 0);
    const leadEst = period === "today" ? lead.estimated24h : lead.estimated7d;
    lines.push("", `The top ${top10.length} gained about ${formatNumber(total)} stars in ${windowText}. ${altLabel(lead)} leads with +${formatNumber(deltaFor(lead, period))}${leadEst ? " (estimated)" : ""}.`);
  }
  lines.push(
    "",
    `## Ranked by stars gained ${period === "today" ? "today" : "this week"}`,
    "",
    "| # | Repo | 24 hours | 7 days | Total stars | What it is |",
    "| --- | --- | --- | --- | --- | --- |",
  );
  rows.forEach((r, i) => {
    const label = altLabel(r);
    const link = `[${label}](${SITE.url}/repo/${r.owner}/${r.name})${label !== r.fullName ? ` (${r.fullName})` : ""}`;
    lines.push(`| ${i + 1} | ${link} | +${r.delta24h}${est(r.estimated24h)} | +${r.delta7d}${est(r.estimated7d)} | ${r.stars} | ${cell(repoBlurb(r) ?? "")} |`);
  });
  lines.push(
    "",
    "Gains marked est. are estimates for repos first seen less than a week ago. Each repo also has a Markdown page: append .md to its repo URL.",
    "",
    "## Other views",
    "",
    ...LANDINGS.filter((x) => x.slug !== l.slug).map((x) => `- ${x.title}: ${SITE.url}/trending/${x.slug}.md`),
    `- By category: ${SITE.url}/category/{slug}.md (e.g. ${SITE.url}/category/mcp.md)`,
    `- One UTC day: ${SITE.url}/daily/{YYYY-MM-DD}.md`,
    "",
    "## More",
    "",
    `- Live leaderboard: ${SITE.url}/ (also ${SITE.url}/llms.txt and ${SITE.url}/api/v1/trending)`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
