import { altLabel } from "@/lib/alternatives";
import { repoBlurb } from "@/lib/blurb";
import { CATEGORIES, type Category } from "@/lib/categories";
import { getData, getReposByCategory, rankRepos } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";

/**
 * Markdown twin of a category hub (/category/{slug}.md), for chatbots and agents answering
 * "which MCP servers / coding agents / local LLM tools are rising on GitHub right now": the same
 * weekly ranking as the HTML hub, in clean text.
 */
export function categoryMarkdown(c: Category): string {
  const ranked = rankRepos(getReposByCategory(c.slug), "week");
  const page = `${SITE.url}/category/${c.slug}`;
  const week = ranked.reduce((n, r) => n + r.delta7d, 0);
  const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  const lines: string[] = [
    `# Fastest-rising ${c.label} repos on GitHub`,
    "",
    `> ${c.description}`,
    "",
    `${ranked.length} tracked repos in this category, ranked by stars gained in the last 7 days. Data from ${SITE.name} as of ${getData().generatedAt} (UTC), updated hourly. HTML page: ${page}`,
  ];
  if (ranked.length) {
    const lead = ranked[0];
    lines.push("", `Together they gained ${formatNumber(week)} stars this week. ${altLabel(lead)} leads with +${formatNumber(lead.delta7d)}${lead.estimated7d ? " (estimated)" : ""}.`);
  }
  lines.push("", "## Ranked by stars gained this week", "", "| # | Repo | 7 days | 24 hours | Total stars | What it is |", "| --- | --- | --- | --- | --- | --- |");
  ranked.forEach((r, i) => {
    const label = altLabel(r);
    const link = `[${label}](${SITE.url}/repo/${r.owner}/${r.name})${label !== r.fullName ? ` (${r.fullName})` : ""}`;
    const est = (v: boolean) => (v ? " est." : "");
    lines.push(`| ${i + 1} | ${link} | +${r.delta7d}${est(r.estimated7d)} | +${r.delta24h}${est(r.estimated24h)} | ${r.stars} | ${cell(repoBlurb(r) ?? "")} |`);
  });
  const others = CATEGORIES.filter((x) => x.slug !== c.slug && getReposByCategory(x.slug).length > 0);
  lines.push(
    "",
    "Gains marked est. are estimates for repos first seen less than a week ago. Each repo also has a Markdown page: append .md to its repo URL.",
    "",
    "## Other categories",
    "",
    ...others.map((x) => `- ${x.label}: ${SITE.url}/category/${x.slug}.md`),
    "",
    "## More",
    "",
    `- All categories: ${SITE.url}/category`,
    `- Live leaderboard across every category: ${SITE.url}/ (also ${SITE.url}/llms.txt and ${SITE.url}/api/v1/trending)`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
