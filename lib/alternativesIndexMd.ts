import { altLabel, alternativesPath, getAlternatives, getAlternativesRepos } from "@/lib/alternatives";
import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { formatDelta, formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { Repo } from "@/lib/types";

/**
 * Markdown twin of the alternatives directory (/alternatives.md), for chatbots and agents answering
 * "what are open-source alternatives to X" without knowing the exact repo URL: every repo that has an
 * alternatives page, grouped by category like the HTML index, with stars, 7-day gain, how many
 * alternatives it has, the top 3 by topic overlap and the link to its own .md list. Same data as /alternatives.
 */
const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

export function alternativesIndexMarkdown(): string {
  const page = `${SITE.url}/alternatives`;
  const repos = getAlternativesRepos().sort((a, b) => b.delta7d - a.delta7d);
  const groups = CATEGORIES.map((c) => ({ c, repos: repos.filter((r) => r.category === c.slug) })).filter((g) => g.repos.length > 0);
  const best = [...repos].sort((a, b) => b.stars - a.stars).slice(0, 8).map((r) => altLabel(r));
  const lines: string[] = [
    "# Open-source alternatives to rising GitHub repos",
    "",
    `${SITE.name} lists open-source alternatives for ${repos.length} of the GitHub repos it tracks${best.length ? `, including ${best.join(", ")}` : ""}. An alternative is another tracked repo sharing at least two GitHub topics about what it does (not platform, language or framework tags), so it works in a similar problem space; it isn't necessarily a drop-in replacement. HTML page: ${page}`,
    "",
    `Data as of ${getData().generatedAt} (UTC), updated hourly. Grouped by category; within each, repos are ordered by stars gained in the last 7 days. Each row links the repo's own alternatives list as Markdown.`,
    "",
    "## Categories",
    "",
    ...groups.map((g) => `- [${g.c.label}](#${g.c.slug}): ${g.repos.length} ${g.repos.length === 1 ? "repo" : "repos"}`),
  ];
  for (const g of groups) {
    lines.push(
      "",
      `## ${g.c.label} alternatives`,
      "",
      `All trending ${g.c.label} repos: ${SITE.url}/category/${g.c.slug}.md`,
      "",
      "| Repo | Stars | 7 days | Alternatives | Top alternatives | Markdown |",
      "| --- | --- | --- | --- | --- | --- |",
    );
    for (const r of g.repos) {
      const alts = getAlternatives(r);
      const tops = alts.slice(0, 3).map((a: { repo: Repo }) => `[${cell(altLabel(a.repo))}](${SITE.url}/repo/${a.repo.owner}/${a.repo.name})`).join("; ");
      const label = altLabel(r);
      const name = `[${cell(label)} alternatives](${SITE.url}${alternativesPath(r)})${label !== r.fullName ? ` (${r.fullName})` : ""}`;
      lines.push(`| ${name} | ${formatNumber(r.stars)} | ${formatDelta(r.delta7d)} | ${alts.length} | ${tops} | [.md](${SITE.url}${alternativesPath(r)}.md) |`);
    }
  }
  lines.push(
    "",
    "## More",
    "",
    `- One repo's alternatives as Markdown: ${SITE.url}/alternatives/{owner}/{name}.md (only the repos listed above)`,
    `- Compare up to 3 tracked repos side by side: ${SITE.url}/compare.md?r={owner}/{name},{owner}/{name}`,
    `- Live leaderboard (last 24 hours and 7 days): ${SITE.url}/index.md (JSON ${SITE.url}/api/v1/trending)`,
    `- Directories: ${SITE.url}/category.md, ${SITE.url}/language.md, ${SITE.url}/topic.md, ${SITE.url}/daily.md`,
    `- Everything for AI agents: ${SITE.url}/llms.txt`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
