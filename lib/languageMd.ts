import { altLabel } from "@/lib/alternatives";
import { repoBlurb } from "@/lib/blurb";
import { getData, rankRepos } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { getLanguages, getReposByLanguage } from "@/lib/languages";
import { SITE } from "@/lib/site";

/**
 * Markdown twin of a language hub (/language/{slug}.md), for chatbots and agents answering
 * "which Python / Rust / TypeScript AI repos are trending on GitHub": the same weekly ranking
 * as the HTML hub, in clean text.
 */
export function languageMarkdown(lang: { slug: string; name: string; count: number }): string {
  const ranked = rankRepos(getReposByLanguage(lang.name), "week");
  const page = `${SITE.url}/language/${lang.slug}`;
  const week = ranked.reduce((n, r) => n + r.delta7d, 0);
  const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  const lines: string[] = [
    `# Trending ${lang.name} repos on GitHub`,
    "",
    `> Open-source AI and developer tools written mainly in ${lang.name} (the main language GitHub detects in the code), ranked by stars gained.`,
    "",
    `${ranked.length} tracked ${lang.name} repos, ranked by stars gained in the last 7 days. Data from ${SITE.name} as of ${getData().generatedAt} (UTC), updated hourly. HTML page: ${page}`,
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
  const others = getLanguages().filter((l) => l.slug !== lang.slug);
  lines.push(
    "",
    "Gains marked est. are estimates for repos first seen less than a week ago. Each repo also has a Markdown page: append .md to its repo URL.",
    "",
    "## Other languages",
    "",
    ...others.map((l) => `- ${l.name} (${l.count} repos): ${SITE.url}/language/${l.slug}.md`),
    "",
    "## More",
    "",
    `- All languages: ${SITE.url}/language`,
    `- By category: ${SITE.url}/category/{slug}.md (e.g. ${SITE.url}/category/mcp.md)`,
    `- Live leaderboard across every language: ${SITE.url}/ (also ${SITE.url}/llms.txt and ${SITE.url}/api/v1/trending)`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
