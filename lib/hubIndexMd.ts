import { altLabel } from "@/lib/alternatives";
import { CATEGORIES } from "@/lib/categories";
import { getData, getReposByCategory, rankRepos } from "@/lib/data";
import { formatDelta } from "@/lib/format";
import { LANGUAGE_MIN, getLanguages, getReposByLanguage } from "@/lib/languages";
import { SITE } from "@/lib/site";
import { TOPIC_MIN, getReposByTopic, getTopics, topicLabel } from "@/lib/topics";
import type { Repo } from "@/lib/types";

/**
 * Markdown twins of the hub directories (/category.md, /language.md, /topic.md), for chatbots and
 * agents answering "which kinds of open-source AI repos are growing fastest" or "what are the
 * trending Rust/MCP repos": every hub with its size, combined 7-day star gain, top 3 risers and a
 * link to the hub's own .md, ranked by 7-day gain. Same numbers as the HTML index pages.
 */
type HubRow = { name: string; slug: string; count: number; week: number; tops: Repo[]; note?: string };

const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const repoLink = (r: Repo) => `[${cell(altLabel(r))}](${SITE.url}/repo/${r.owner}/${r.name}) ${formatDelta(r.delta7d)}`;

function hubIndex(o: { section: string; heading: string; intro: string; kind: string; rows: HubRow[]; extra?: string[] }): string {
  const page = `${SITE.url}/${o.section}`;
  const rows = [...o.rows].sort((a, b) => b.week - a.week || b.count - a.count);
  const data = getData();
  const lines: string[] = [`# ${o.heading}`, "", `${o.intro} HTML page: ${page}`, "", `Data as of ${data.generatedAt} (updated hourly). ${rows.length} ${o.kind} hubs, ranked by stars gained together in the last 7 days.`];
  const total = rows.reduce((n, r) => n + Math.max(0, r.week), 0);
  const lead = rows[0];
  if (lead && total > 0) {
    let s = `${lead.name} leads this week with ${formatDelta(lead.week)} stars across ${lead.count} tracked repos (${Math.round((lead.week / total) * 100)}% of the gains listed here)`;
    s += lead.tops[0] ? `, led by ${altLabel(lead.tops[0])} (${formatDelta(lead.tops[0].delta7d)}).` : ".";
    if (rows[1]) s += ` ${rows[1].name} is second with ${formatDelta(rows[1].week)}.`;
    lines.push("", s);
  }
  lines.push("", `## All ${o.kind} hubs`, "", `| # | ${o.kind[0].toUpperCase()}${o.kind.slice(1)} | Repos | 7-day stars | Top risers this week | Markdown |`, "| --- | --- | --- | --- | --- | --- |");
  rows.forEach((h, i) => {
    const name = `[${cell(h.name)}](${page}/${h.slug})${h.note ? ` (${cell(h.note)})` : ""}`;
    lines.push(`| ${i + 1} | ${name} | ${h.count} | ${formatDelta(h.week)} | ${h.tops.map(repoLink).join("; ")} | [${h.slug}.md](${page}/${h.slug}.md) |`);
  });
  lines.push(
    "",
    "## More",
    "",
    ...(o.extra ?? []),
    `- Each hub as RSS (top 30 by 24-hour stars): ${page}/{slug}/rss.xml`,
    `- Live leaderboard (last 24 hours and 7 days): ${SITE.url}/index.md (HTML ${SITE.url}/; JSON ${SITE.url}/api/v1/trending)`,
    `- Other directories: ${["category", "language", "topic"].filter((s) => s !== o.section).map((s) => `${SITE.url}/${s}.md`).join(", ")}, ${SITE.url}/daily.md`,
    `- Everything for AI agents: ${SITE.url}/llms.txt`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

const sum7d = (repos: Repo[]) => repos.reduce((n, r) => n + r.delta7d, 0);

export function categoryIndexMarkdown(): string {
  return hubIndex({
    section: "category",
    heading: "Open-source AI and dev-tool categories, by growth",
    intro: `Every ${SITE.name} category hub, from AI agents and MCP servers to local LLMs and DevOps. Each hub ranks its tracked GitHub repos by stars gained.`,
    kind: "category",
    rows: CATEGORIES.map((c) => {
      const repos = getReposByCategory(c.slug);
      return { name: c.label, slug: c.slug, count: repos.length, week: sum7d(repos), tops: rankRepos(repos, "week").slice(0, 3), note: c.description };
    }).filter((r) => r.count > 0),
  });
}

export function languageIndexMarkdown(): string {
  return hubIndex({
    section: "language",
    heading: "Programming languages with rising GitHub repos",
    intro: `Every ${SITE.name} programming-language hub (languages with at least ${LANGUAGE_MIN} tracked repos). Each hub ranks the tracked open-source AI and developer-tool repos written mainly in that language by stars gained.`,
    kind: "language",
    rows: getLanguages().map((l) => {
      const repos = getReposByLanguage(l.name);
      return { name: l.name, slug: l.slug, count: repos.length, week: sum7d(repos), tops: rankRepos(repos, "week").slice(0, 3) };
    }),
  });
}

export function topicIndexMarkdown(): string {
  return hubIndex({
    section: "topic",
    heading: "GitHub topics with rising open-source repos",
    intro: `Every ${SITE.name} GitHub topic hub (topics used by at least ${TOPIC_MIN} tracked repos; language topics live under ${SITE.url}/language). Each hub ranks the tracked repos tagged with that topic by stars gained.`,
    kind: "topic",
    rows: getTopics().map((t) => {
      const repos = getReposByTopic(t.slug);
      return { name: topicLabel(t.slug), slug: t.slug, count: repos.length, week: sum7d(repos), tops: rankRepos(repos, "week").slice(0, 3) };
    }),
  });
}
