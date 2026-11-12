import { altLabel, alternativesPath, getAlternatives, hasAlternativesPage } from "@/lib/alternatives";
import { categoryLabel } from "@/lib/categories";
import { getData, getRepos, rankRepos } from "@/lib/data";
import { getDetails } from "@/lib/details";
import { formatDelta, formatNumber } from "@/lib/format";
import { getHnMentions } from "@/lib/mentions";
import { isThinRepo } from "@/lib/thin";
import { SITE } from "@/lib/site";
import type { Repo } from "@/lib/types";
import { dropTemplateWhy } from "@/lib/whyNotes";

/**
 * Markdown twin of a repo page (/repo/{owner}/{name}.md), for chatbots and agents that prefer
 * clean text over HTML: the same numbers as the page and the JSON API, in a few hundred tokens.
 */
export function repoMarkdown(r: Repo): string {
  const all = getRepos();
  const rankOf = (period: "today" | "week") => rankRepos(all, period).findIndex((x) => x.fullName === r.fullName) + 1;
  const page = `${SITE.url}/repo/${r.owner}/${r.name}`;
  const label = altLabel(r);
  const summary = dropTemplateWhy(r.oneLiner) || r.description;
  const details = getDetails(r.fullName);
  const hn = getHnMentions(r.fullName);
  const alts = hasAlternativesPage(r) ? getAlternatives(r).slice(0, 5) : [];
  const est = " (estimated: first seen less than a week ago)";
  const lines: string[] = [
    `# ${label === r.fullName ? r.fullName : `${label} (${r.fullName})`}`,
    "",
    summary ? `> ${summary}` : "",
    "",
    `Data from ${SITE.name} as of ${getData().generatedAt} (UTC), updated hourly. HTML page: ${page}`,
    "",
    "## Star velocity",
    "",
    `- Stars: ${formatNumber(r.stars)} (${r.stars})`,
    `- Gained in the last 24 hours: ${formatDelta(r.delta24h)}${r.estimated24h ? est : ""}`,
    `- Gained in the last 7 days: ${formatDelta(r.delta7d)}${r.estimated7d ? est : ""}`,
    `- Rank today: #${rankOf("today")} of ${all.length} tracked repos`,
    `- Rank this week: #${rankOf("week")} of ${all.length} tracked repos`,
    `- Forks: ${formatNumber(r.forks)}`,
    "",
    "## Facts",
    "",
    `- GitHub: ${r.url}`,
    ...(r.homepage ? [`- Homepage: ${r.homepage}`] : []),
    `- Category: [${categoryLabel(r.category)}](${SITE.url}/category/${r.category})`,
    ...(r.language ? [`- Language: ${r.language}`] : []),
    ...(r.license?.spdx ? [`- License: ${r.license.spdx}`] : []),
    ...(r.topics.length ? [`- Topics: ${r.topics.join(", ")}`] : []),
    `- Created: ${r.createdAt.slice(0, 10)}; last push: ${r.pushedAt.slice(0, 10)}`,
  ];
  if (details?.whoItsFor || details?.useCases?.length || details?.installCommand) {
    lines.push("", "## What it's for", "");
    if (details.whoItsFor) lines.push(`- Who it's for: ${details.whoItsFor}`);
    for (const u of details.useCases ?? []) lines.push(`- ${u}`);
    if (details.installCommand) lines.push("", "Install:", "", "```", details.installCommand, "```");
  }
  if (r.history.length > 1) {
    lines.push("", "## Daily star history (recent)", "", "| Date | Stars |", "| --- | --- |");
    for (const h of r.history.slice(-14)) lines.push(`| ${h.date} | ${h.stars} |`);
  }
  if (hn?.top) {
    lines.push("", "## Hacker News", "", `- ${hn.count} ${hn.count === 1 ? "story" : "stories"}; top: "${hn.top.title}" (${hn.top.points} points, ${hn.top.comments} comments, ${hn.top.date}) https://news.ycombinator.com/item?id=${hn.top.id}`);
  }
  if (alts.length) {
    lines.push("", "## Alternatives", "");
    for (const a of alts) lines.push(`- [${altLabel(a.repo)}](${SITE.url}/repo/${a.repo.owner}/${a.repo.name}): ${formatDelta(a.repo.delta7d)} stars this week`);
    lines.push("", `More: ${SITE.url}${alternativesPath(r)}`);
  }
  // Same "More from {owner}" list as the HTML page: the owner's other tracked, indexable repos.
  const listed = new Set([r.fullName, ...alts.map((a) => a.repo.fullName)]);
  const fromOwner = rankRepos(all, "week")
    .filter((x) => x.owner.toLowerCase() === r.owner.toLowerCase() && !listed.has(x.fullName) && !isThinRepo(x))
    .slice(0, 6);
  if (fromOwner.length) {
    lines.push("", `## More from ${r.owner} on ${SITE.name}`, "");
    for (const x of fromOwner) lines.push(`- [${altLabel(x)}](${SITE.url}/repo/${x.owner}/${x.name}): ${formatDelta(x.delta7d)} stars this week`);
  }
  lines.push(
    "",
    "## More",
    "",
    `- JSON: ${SITE.url}/api/v1/repo/${r.owner}/${r.name}`,
    `- README badge: ${SITE.url}/badge/${r.owner}/${r.name}`,
    `- Full leaderboard: ${SITE.url}/ (also ${SITE.url}/llms.txt)`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
