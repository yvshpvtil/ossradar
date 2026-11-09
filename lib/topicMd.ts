import { altLabel } from "@/lib/alternatives";
import { repoBlurb } from "@/lib/blurb";
import { categoryLabel } from "@/lib/categories";
import { getData, rankRepos } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";
import { getReposByTopic, getTopics, relatedTopics, topicLabel, topicVariants } from "@/lib/topics";

/**
 * Markdown twin of a topic hub (/topic/{slug}.md), for chatbots and agents answering
 * "which RAG / Claude Code / MCP repos are trending on GitHub": the same weekly ranking
 * as the HTML hub, in clean text.
 */
export function topicMarkdown(slug: string): string {
  const repos = getReposByTopic(slug);
  const ranked = rankRepos(repos, "week");
  const label = topicLabel(slug);
  const page = `${SITE.url}/topic/${slug}`;
  const week = ranked.reduce((n, r) => n + r.delta7d, 0);
  const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  const tags = topicVariants(slug).map((v) => `\`${v}\``).join(" or ");
  const lines: string[] = [
    `# Trending ${label} GitHub repos`,
    "",
    `> Open-source repos whose maintainers tagged them ${tags} on GitHub, ranked by stars gained.`,
    "",
    `${ranked.length} tracked repos with this GitHub topic, ranked by stars gained in the last 7 days. Data from ${SITE.name} as of ${getData().generatedAt} (UTC), updated hourly. HTML page: ${page}`,
  ];
  if (ranked.length) {
    const lead = ranked[0];
    lines.push("", `Together they gained ${formatNumber(week)} stars this week. ${altLabel(lead)} leads with +${formatNumber(lead.delta7d)}${lead.estimated7d ? " (estimated)" : ""}.`);
  }
  lines.push("", "## Ranked by stars gained this week", "", "| # | Repo | Category | 7 days | 24 hours | Total stars | What it is |", "| --- | --- | --- | --- | --- | --- | --- |");
  ranked.forEach((r, i) => {
    const name = altLabel(r);
    const link = `[${name}](${SITE.url}/repo/${r.owner}/${r.name})${name !== r.fullName ? ` (${r.fullName})` : ""}`;
    const est = (v: boolean) => (v ? " est." : "");
    lines.push(`| ${i + 1} | ${link} | ${categoryLabel(r.category)} | +${r.delta7d}${est(r.estimated7d)} | +${r.delta24h}${est(r.estimated24h)} | ${r.stars} | ${cell(repoBlurb(r) ?? "")} |`);
  });
  const related = relatedTopics(repos, { exclude: slug, limit: 12 });
  lines.push("", "Gains marked est. are estimates for repos first seen less than a week ago. Each repo also has a Markdown page: append .md to its repo URL.");
  if (related.length) {
    lines.push("", "## Related topics", "", ...related.map((t) => `- ${topicLabel(t.slug)} (${t.overlap} shared repos): ${SITE.url}/topic/${t.slug}.md`));
  }
  lines.push(
    "",
    "## More",
    "",
    `- All ${getTopics().length} topic hubs: ${SITE.url}/topic`,
    `- By category: ${SITE.url}/category/{slug}.md (e.g. ${SITE.url}/category/mcp.md)`,
    `- By language: ${SITE.url}/language/{slug}.md (e.g. ${SITE.url}/language/python.md)`,
    `- Live leaderboard across every topic: ${SITE.url}/ (also ${SITE.url}/llms.txt and ${SITE.url}/api/v1/trending)`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
