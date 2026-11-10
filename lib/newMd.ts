import { altLabel } from "@/lib/alternatives";
import { repoBlurb, stripWhy } from "@/lib/blurb";
import { categoryLabel } from "@/lib/categories";
import { getData } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { NEW_DAYS, getNewRepos } from "@/lib/newRepos";
import { SITE } from "@/lib/site";

/**
 * Markdown twin of /new (/new.md), for chatbots and agents answering "what new open-source AI
 * projects launched this week" or "newest GitHub AI repos": the same rows as the HTML page
 * (tracked repos created in the last NEW_DAYS days, grouped by creation day), in clean text.
 */
export function newReposMarkdown(): string {
  const data = getData();
  const groups = getNewRepos();
  const all = groups.flatMap((g) => g.repos);
  const page = `${SITE.url}/new`;
  const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  const lines: string[] = [
    "# New open-source AI & dev-tool repos, day by day",
    "",
    `> Open-source AI and developer-tool projects created on GitHub in the last ${NEW_DAYS} days that are already among the ${data.repos.length} fastest-rising repos ${SITE.name} tracks, grouped by the day they were created (UTC).`,
    "",
    `${all.length} new repos. Data as of ${data.generatedAt} (UTC), updated hourly. HTML page: ${page}`,
  ];
  const top = [...all].sort((a, b) => b.delta7d - a.delta7d || b.stars - a.stars).slice(0, 3);
  if (top.length > 0) {
    const weekTotal = all.reduce((n, r) => n + Math.max(0, r.delta7d), 0);
    const names = top.map((r) => `${altLabel(r)} (+${formatNumber(r.delta7d)}${r.estimated7d ? " est." : ""}, created ${r.createdAt.slice(0, 10)})`);
    const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
    lines.push("", `Together they gained about ${formatNumber(weekTotal)} stars in the last 7 days. Fastest-rising new repos: ${list}.`);
  }
  for (const g of groups) {
    lines.push(
      "",
      `## Created ${g.day} (${g.repos.length} new)`,
      "",
      "| Repo | Total stars | 7 days | Category | Language | What it is |",
      "| --- | --- | --- | --- | --- | --- |",
    );
    for (const r of g.repos) {
      const label = altLabel(r);
      const repo = `[${label}](${SITE.url}/repo/${r.owner}/${r.name})${label !== r.fullName ? ` (${r.fullName})` : ""}`;
      const blurb = repoBlurb(r) ?? stripWhy(r.oneLiner) ?? "";
      lines.push(`| ${repo} | ${r.stars} | +${r.delta7d}${r.estimated7d ? " est." : ""} | ${categoryLabel(r.category)} | ${r.language ?? ""} | ${cell(blurb)} |`);
    }
  }
  if (groups.length === 0) lines.push("", `No new repos in the last ${NEW_DAYS} days yet.`);
  lines.push(
    "",
    "Weekly gains marked est. are estimates for repos first seen less than a week ago. Each repo also has a Markdown page: append .md to its repo URL.",
    "",
    "## More",
    "",
    `- New repos rising (ranked by star gain): ${SITE.url}/trending/new-ai-repos.md`,
    `- Trending this week: ${SITE.url}/trending/ai-repos-this-week.md`,
    `- Hacker News: ${SITE.url}/hacker-news.md`,
    `- Live leaderboard: ${SITE.url}/ (also ${SITE.url}/llms.txt and ${SITE.url}/api/v1/trending)`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
