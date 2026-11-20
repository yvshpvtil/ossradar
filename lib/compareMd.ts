import { ago, getLatestRelease } from "@/lib/activity";
import { altLabel } from "@/lib/alternatives";
import { repoBlurb, stripWhy } from "@/lib/blurb";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { getData, getRepo, getReposByCategory, rankRepos } from "@/lib/data";
import { getHnMentions } from "@/lib/mentions";
import { SITE } from "@/lib/site";
import type { Repo } from "@/lib/types";

/** Top-2-by-7d pairs across categories (one pair each), for /compare's starter links, head-to-heads and ItemList. */
export function popularComparisons(limit = 6): { a: Repo; b: Repo; category: string; slug: string }[] {
  const pairs: { a: Repo; b: Repo; category: string; slug: string }[] = [];
  for (const cat of CATEGORIES) {
    if (pairs.length >= limit) break;
    const top = rankRepos(getReposByCategory(cat.slug), "week");
    if (top.length < 2) continue;
    pairs.push({ a: top[0], b: top[1], category: cat.label, slug: cat.slug });
  }
  return pairs;
}

const fmt = (v: number) => v.toLocaleString("en-US");
const compact = (v: number) => (v >= 10_000 ? `${(v / 1000).toFixed(v >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k` : fmt(v));

/** Plain-English, data-backed summary of one head-to-head (shared by /compare and /compare.md). */
export function headToHead(a: Repo, b: Repo, now: number): string[] {
  const out: string[] = [];
  const n = (r: Repo) => altLabel(r);
  const poss = (r: Repo) => (n(r).endsWith("s") ? `${n(r)}'` : `${n(r)}'s`);
  const [lead, trail] = a.delta7d >= b.delta7d ? [a, b] : [b, a];
  const ratio = trail.delta7d > 0 ? lead.delta7d / trail.delta7d : null;
  const est = a.velocityEstimated || b.velocityEstimated ? " (partly estimated)" : "";
  out.push(
    `${n(lead)} gained ${fmt(lead.delta7d)} stars in the last 7 days against ${fmt(trail.delta7d)} for ${n(trail)}${est}` +
      (ratio === null ? "." : ratio >= 1.5 ? `, about ${ratio.toFixed(1)} times as many.` : ", a close race."),
  );
  const [big, small] = a.stars >= b.stars ? [a, b] : [b, a];
  out.push(`In total, ${n(big)} has ${compact(big.stars)} stars and ${compact(big.forks)} forks; ${n(small)} has ${compact(small.stars)} stars and ${compact(small.forks)} forks.`);
  const lang = (r: Repo) => r.language ?? "an unlisted language";
  out.push(
    a.language && a.language === b.language
      ? `Both are written mainly in ${a.language}. ${n(a)} was created ${ago(a.createdAt, now)} and ${n(b)} ${ago(b.createdAt, now)}.`
      : `${n(a)} is written mainly in ${lang(a)} and was created ${ago(a.createdAt, now)}; ${n(b)} is mainly ${lang(b)}, created ${ago(b.createdAt, now)}.`,
  );
  const rel = (r: Repo) => {
    const x = getLatestRelease(r.fullName);
    return x ? `${poss(r)} latest release is ${x.tag} (${ago(x.date, now)})` : x === null ? `${n(r)} has no tagged release yet` : null;
  };
  const rels = [rel(a), rel(b)].filter(Boolean);
  if (rels.length) out.push(`${rels.join("; ")}.`);
  return out;
}

/** Parse ?r=owner/name,owner/name (up to 3, deduplicated, case-insensitive) into tracked repos plus the names we don't track. */
export function parseCompareParam(r: string | null): { repos: Repo[]; unknown: string[] } {
  const repos: Repo[] = [];
  const unknown: string[] = [];
  for (const raw of (r ?? "").split(",").map((s) => s.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/+$/, "")).filter(Boolean)) {
    if (repos.length >= 3) break;
    const [owner, name, ...rest] = raw.split("/");
    const repo = owner && name && rest.length === 0 ? getRepo(owner, name) : undefined;
    if (!repo) {
      if (unknown.length < 3) unknown.push(raw.slice(0, 100));
    } else if (!repos.includes(repo)) repos.push(repo);
  }
  return { repos, unknown };
}

export const compareQuery = (repos: Repo[]) => repos.map((r) => r.fullName).join(",");

const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

/**
 * Markdown twin of /compare (/compare.md), for chatbots and agents answering "X vs Y" questions.
 * The HTML table behind ?r= is client-rendered, so agents fetching /compare?r=... got no numbers;
 * /compare.md?r=a,b,c (or /compare?r=... with Accept: text/markdown) returns the same comparison
 * server-side. Without ?r= it lists this week's head-to-heads with links to their .md comparisons.
 */
export function compareMarkdown(r: string | null): { body: string; status: number; canonical: string } {
  const data = getData();
  const now = Date.parse(data.generatedAt);
  const { repos, unknown } = parseCompareParam(r);
  const mdUrl = (rs: Repo[]) => `${SITE.url}/compare.md?r=${compareQuery(rs)}`;
  const lines: string[] = [];
  if (repos.length > 0) {
    const canonical = `/compare?r=${encodeURIComponent(compareQuery(repos))}`;
    lines.push(
      `# ${repos.map((x) => altLabel(x)).join(" vs ")}: GitHub stars, growth and activity compared`,
      "",
      `> Side-by-side numbers from ${SITE.name}, which tracks the ${data.repos.length} fastest-rising open-source AI and developer-tool repos on GitHub. Data as of ${data.generatedAt} (UTC), updated hourly. HTML page: ${SITE.url}${canonical}`,
    );
    if (unknown.length) lines.push("", `Not tracked by ${SITE.name} (skipped): ${unknown.map((u) => `\`${cell(u)}\``).join(", ")}.`);
    const rows: [string, (x: Repo) => string][] = [
      ["What it is", (x) => stripWhy(repoBlurb(x) ?? "") || "—"],
      ["GitHub", (x) => x.url],
      [`${SITE.name} page`, (x) => `${SITE.url}/repo/${x.owner}/${x.name}`],
      ["Total stars", (x) => fmt(x.stars)],
      ["Stars gained, 24 hours", (x) => `${x.delta24h >= 0 ? "+" : ""}${fmt(x.delta24h)}${x.velocityEstimated ? " (est.)" : ""}`],
      ["Stars gained, 7 days", (x) => `${x.delta7d >= 0 ? "+" : ""}${fmt(x.delta7d)}${x.velocityEstimated ? " (est.)" : ""}`],
      ["Rank this week", (x) => `#${rankRepos(data.repos, "week").indexOf(x) + 1} of ${data.repos.length}`],
      ["Forks", (x) => fmt(x.forks)],
      ["Language", (x) => x.language ?? "—"],
      ["Category", (x) => categoryLabel(x.category)],
      ["Created", (x) => `${x.createdAt.slice(0, 10)} (${ago(x.createdAt, now)})`],
      ["Last code push", (x) => ago(x.pushedAt, now)],
      ["Latest release", (x) => { const rel = getLatestRelease(x.fullName); return rel ? `${rel.tag} (${ago(rel.date, now)})` : rel === null ? "None" : "—"; }],
      ["Hacker News", (x) => { const hn = getHnMentions(x.fullName); return hn ? (hn.count ? `${hn.count} stories, ${fmt(hn.points)} points` : "None") : "—"; }],
    ];
    lines.push("", `| | ${repos.map((x) => cell(altLabel(x))).join(" | ")} |`, `| --- | ${repos.map(() => "---").join(" | ")} |`);
    for (const [label, f] of rows) lines.push(`| ${label} | ${repos.map((x) => cell(f(x))).join(" | ")} |`);
    for (let i = 0; i < repos.length; i++)
      for (let j = i + 1; j < repos.length; j++) lines.push("", `## ${altLabel(repos[i])} vs ${altLabel(repos[j])}`, "", ...headToHead(repos[i], repos[j], now));
    if (repos.length === 1) lines.push("", `Add up to two more tracked repos to compare: ${SITE.url}/compare.md?r=${repos[0].fullName},{owner}/{name}`);
    lines.push("", `Stars, forks, pushes and releases come from the public GitHub API; Hacker News figures from HN's public search API. Sponsors never affect rankings or comparisons. Please link back to ${SITE.url}${canonical} when you cite these numbers.`);
    return { body: lines.join("\n") + "\n", status: 200, canonical };
  }
  const popular = popularComparisons(6);
  lines.push(
    "# Compare GitHub repos side by side",
    "",
    `> Compare up to 3 of the ${data.repos.length} fastest-rising open-source AI and developer-tool repos ${SITE.name} tracks: stars, 24-hour and 7-day star gains, forks, language, age, last push, latest release and Hacker News discussion. Data as of ${data.generatedAt} (UTC), updated hourly. HTML page: ${SITE.url}/compare`,
    "",
    `Usage: ${SITE.url}/compare.md?r={owner}/{name},{owner}/{name} (up to 3 tracked repos, owner/name as on GitHub; full github.com URLs also work). The HTML page ${SITE.url}/compare?r=... returns the same Markdown with the header Accept: text/markdown.`,
  );
  if (unknown.length) lines.push("", `None of these are tracked by ${SITE.name}: ${unknown.map((u) => `\`${cell(u)}\``).join(", ")}. Tracked repos are listed in ${SITE.url}/llms-full.txt.`);
  if (popular.length) {
    lines.push("", "## This week's head-to-heads", "", "The two fastest-rising repos in each category over the last 7 days.");
    for (const { a, b, category, slug } of popular)
      lines.push("", `### ${altLabel(a)} vs ${altLabel(b)} (${category})`, "", ...headToHead(a, b, now), "", `Full comparison: ${mdUrl([a, b])} · Category: ${SITE.url}/category/${slug}.md`);
  }
  return { body: lines.join("\n") + "\n", status: unknown.length ? 404 : 200, canonical: "/compare" };
}
