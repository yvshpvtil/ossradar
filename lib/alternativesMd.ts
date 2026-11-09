import { altLabel, alternativesPath, getAlternatives, getCategoryNeighbors, hasAlternativesPage } from "@/lib/alternatives";
import { categoryLabel } from "@/lib/categories";
import { getData } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";
import { canonicalTopic, topicLabel } from "@/lib/topics";
import type { Repo } from "@/lib/types";
import { stripWhy } from "@/lib/why";

/**
 * Markdown twin of an alternatives page (/alternatives/{owner}/{name}.md), for chatbots and agents
 * answering "what are open-source alternatives to X": the same topic-overlap matches as the HTML
 * page, in clean text.
 */
export function alternativesMarkdown(repo: Repo): string {
  const alts = getAlternatives(repo);
  const neighbors = getCategoryNeighbors(repo, alts);
  const subject = altLabel(repo);
  const cat = categoryLabel(repo.category);
  const page = `${SITE.url}${alternativesPath(repo)}`;
  const repoUrl = `${SITE.url}/repo/${repo.owner}/${repo.name}`;
  const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  const link = (r: Repo) => {
    const label = altLabel(r);
    return `[${label}](${SITE.url}/repo/${r.owner}/${r.name})${label !== r.fullName ? ` (${r.fullName})` : ""}`;
  };
  const est = (v: boolean) => (v ? " est." : "");
  const about = stripWhy(repo.oneLiner);
  const lines: string[] = [
    `# ${alts.length} open-source alternatives to ${subject}`,
    "",
    `${link(repo)} has ${formatNumber(repo.stars)} stars and gained +${formatNumber(repo.delta7d)}${est(repo.estimated7d)} in the last 7 days.${about ? ` ${about}` : ""}`,
    "",
    `Below are other repos tracked by ${SITE.name} that share GitHub topics about what they do with ${repo.name} (platform, language and framework tags don't count), ordered by how closely their topics overlap (rarer shared topics count more), then by stars gained this week. Topic overlap means a similar problem space, not a drop-in replacement, so check each project's README. Data as of ${getData().generatedAt} (UTC), updated hourly. HTML page: ${page}`,
    "",
    "## Alternatives",
    "",
    "| # | Repo | Category | 7 days | Total stars | Shared topics | What it is |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  alts.forEach((a, i) => {
    const r = a.repo;
    const topics = [...new Set(a.sharedTopics.map(canonicalTopic))].map(topicLabel).join(", ");
    lines.push(`| ${i + 1} | ${link(r)} | ${categoryLabel(r.category)} | +${r.delta7d}${est(r.estimated7d)} | ${r.stars} | ${cell(topics)} | ${cell(stripWhy(r.oneLiner) ?? "")} |`);
  });
  if (neighbors.length) {
    lines.push("", `## More rising ${cat} repos`, "", `Same category but no shared topics, so related projects rather than alternatives:`, "");
    for (const r of neighbors) lines.push(`- ${link(r)}: +${r.delta7d}${est(r.estimated7d)} stars this week${stripWhy(r.oneLiner) ? `. ${cell(stripWhy(r.oneLiner)!)}` : ""}`);
  }
  const moreAlts = alts.filter((a) => hasAlternativesPage(a.repo)).slice(0, 6);
  lines.push(
    "",
    "Gains marked est. are estimates for repos first seen less than a week ago. Each repo also has a Markdown page: append .md to its repo URL.",
    "",
    "## More",
    "",
    `- ${subject} repo page: ${repoUrl} (Markdown: ${repoUrl}.md)`,
    ...moreAlts.map((a) => `- Alternatives to ${altLabel(a.repo)}: ${SITE.url}${alternativesPath(a.repo)}.md`),
    `- All trending ${cat} repos: ${SITE.url}/category/${repo.category}.md`,
    `- Alternatives to other trending repos: ${SITE.url}/alternatives`,
    `- Live leaderboard: ${SITE.url}/ (also ${SITE.url}/llms.txt and ${SITE.url}/api/v1/trending)`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
