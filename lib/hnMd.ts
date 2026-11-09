import { altLabel } from "@/lib/alternatives";
import { repoBlurb, stripWhy } from "@/lib/blurb";
import { getData, getRepos } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { getRecentHn } from "@/lib/mentions";
import { SITE } from "@/lib/site";

const DAYS = 30;

/**
 * Markdown twin of /hacker-news (/hacker-news.md), for chatbots and agents answering
 * "which GitHub repos are trending on Hacker News" or "what open-source AI projects hit HN this month":
 * the same rows as the HTML page (tracked repos with a top HN story in the last 30 days, by points), in clean text.
 */
export function hackerNewsMarkdown(): string {
  const data = getData();
  const byName = new Map(getRepos().map((r) => [r.fullName, r]));
  const items = getRecentHn(DAYS, Date.parse(data.generatedAt)).flatMap(({ fullName, m }) => {
    const r = byName.get(fullName);
    return r && m.top ? [{ fullName, r, top: m.top }] : [];
  });
  const page = `${SITE.url}/hacker-news`;
  const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  const lines: string[] = [
    "# GitHub repos trending on Hacker News",
    "",
    `> Tracked open-source AI and developer-tool repos that were posted to Hacker News in the last ${DAYS} days, ranked by the story's points (upvotes). "Show HN" posts are makers presenting their own project.`,
    "",
    `${items.length} repos. HN data from the public HN Algolia API, refreshed every 12 hours; star data from ${SITE.name} as of ${data.generatedAt} (UTC), updated hourly. HTML page: ${page}`,
  ];
  const lead = items[0];
  if (lead) {
    const showHn = items.filter(({ top }) => /^show hn/i.test(top.title)).length;
    const most = [...items].sort((a, b) => b.top.comments - a.top.comments)[0];
    let s = `The top story right now is ${altLabel(lead.r)} with ${formatNumber(lead.top.points)} points and ${formatNumber(lead.top.comments)} comments (${lead.top.date.slice(0, 10)}).`;
    if (most && most.fullName !== lead.fullName) s += ` The most discussed is ${altLabel(most.r)} (${formatNumber(most.top.comments)} comments).`;
    s += ` ${showHn} of the ${items.length} stories are Show HN posts.`;
    lines.push("", s);
  }
  lines.push(
    "",
    "## Hacker News stories, ranked by points",
    "",
    "| # | HN story | Points | Comments | Posted | Repo | Total stars | 7 days | What it is |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );
  items.forEach(({ fullName, r, top }, i) => {
    const label = altLabel(r);
    const repo = `[${label}](${SITE.url}/repo/${r.owner}/${r.name})${label !== fullName ? ` (${fullName})` : ""}`;
    const story = `[${cell(top.title).replace(/[[\]]/g, "\\$&")}](https://news.ycombinator.com/item?id=${top.id})`;
    const blurb = repoBlurb(r) ?? stripWhy(r.oneLiner) ?? "";
    lines.push(`| ${i + 1} | ${story} | ${top.points} | ${top.comments} | ${top.date.slice(0, 10)} | ${repo} | ${r.stars} | +${r.delta7d}${r.estimated7d ? " est." : ""} | ${cell(blurb)} |`);
  });
  lines.push(
    "",
    "Weekly gains marked est. are estimates for repos first seen less than a week ago. Each repo also has a Markdown page: append .md to its repo URL.",
    "",
    "## More",
    "",
    `- Trending this week: ${SITE.url}/trending/ai-repos-this-week.md`,
    `- New repos rising: ${SITE.url}/trending/new-ai-repos.md`,
    `- By category: ${SITE.url}/category/{slug}.md (e.g. ${SITE.url}/category/mcp.md)`,
    `- Live leaderboard: ${SITE.url}/ (also ${SITE.url}/llms.txt and ${SITE.url}/api/v1/trending)`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
