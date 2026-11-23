import { getData, getRepos, rankRepos } from "@/lib/data";
import { badgeSpec } from "@/lib/badge";
import { formatDelta } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { Repo } from "@/lib/types";

/** Ready-made README snippets for one repo (or the {owner}/{name} pattern). */
export function badgeSnippets(owner: string, name: string) {
  const img = `${SITE.url}/badge/${owner}/${name}`;
  const page = `${SITE.url}/repo/${owner}/${name}`;
  return {
    markdown: `[![Trending on ${SITE.name}](${img})](${page})`,
    html: `<a href="${page}"><img src="${img}" alt="Trending on ${SITE.name}" height="20"></a>`,
    rst: `.. image:: ${img}\n   :target: ${page}\n   :alt: Trending on ${SITE.name}`,
  };
}

/**
 * Markdown twin of /badge (/badge.md), for agents asked "add an OSS Radar badge to my README" or
 * "what does the OSS Radar badge mean": what each badge state means, copy-paste snippets
 * (Markdown, HTML, reStructuredText), how to check whether a repo is tracked, and today's top 10
 * with the badge text each one shows right now. Same facts as the HTML page; rebuilt hourly.
 */
export function badgeMarkdown(): string {
  const repos = getRepos();
  const top = rankRepos(repos, "today").slice(0, 10);
  const p = badgeSnippets("{owner}", "{name}");
  const label = (r: Repo) => badgeSpec(r).message;
  const lines: string[] = [
    `# ${SITE.name} README badge`,
    "",
    `Every GitHub repo ${SITE.name} tracks (${repos.length} right now) gets a free SVG badge for its README. It shows the repo's live trending rank by stars gained in the last 24 hours and links to its ${SITE.name} page (star history, 24h and 7-day gains, alternatives). No sign-up, no key. HTML page with a lookup box: ${SITE.url}/badge`,
    "",
    `Data as of ${getData().generatedAt} (UTC); badges recompute every hour.`,
    "",
    "## What the badge shows",
    "",
    "- **Trending #N** (green): the repo is in the top 100 of the leaderboard by stars gained in the last 24 hours.",
    "- **Tracked** (gray): tracked, but outside today's top 100.",
    `- **not tracked** (gray): ${SITE.name} doesn't follow the repo (never added, or dropped out of the tracked set).`,
    "",
    "Adding the badge never changes a repo's rank; rankings come from GitHub star counts only.",
    "",
    "## Embed code",
    "",
    "Replace `{owner}` and `{name}` with the repo exactly as on GitHub (matching is case-insensitive).",
    "",
    "Markdown (README.md):",
    "",
    "```markdown",
    p.markdown,
    "```",
    "",
    "HTML (GitHub READMEs, docs sites):",
    "",
    "```html",
    p.html,
    "```",
    "",
    "reStructuredText (README.rst, Sphinx):",
    "",
    "```rst",
    p.rst,
    "```",
    "",
    "## Is my repo tracked?",
    "",
    `- Fetch ${SITE.url}/api/v1/repo/{owner}/{name}: 200 with the repo's numbers if tracked, 404 if not.`,
    `- Or open ${SITE.url}/badge/{owner}/{name}: the SVG text says "not tracked" for repos ${SITE.name} doesn't follow.`,
    `- Not tracked? Suggest it at ${SITE.url}/submit (free, reviewed by hand; ${SITE.name} tracks fast-rising open-source AI and developer-tool repos).`,
    "",
    "## Details",
    "",
    "- Format: SVG, 20px high, shields.io style; served with `Cache-Control: s-maxage=3600` so it refreshes about hourly (GitHub's image proxy may cache a little longer).",
    "- `.svg` suffix is optional: /badge/{owner}/{name}.svg works too.",
    "- Badge images are `noindex`; the repo page they link to is the page meant for search.",
    `- Each tracked repo's Markdown twin (${SITE.url}/repo/{owner}/{name}.md) includes its ready-made snippet.`,
  ];
  if (top.length) {
    lines.push("", "## Badges right now: today's top 10", "", "| # | Repo | Badge text | 24h stars | Markdown snippet |", "|---|---|---|---|---|");
    top.forEach((r, i) => {
      const s = badgeSnippets(r.owner, r.name).markdown;
      lines.push(`| ${i + 1} | [${r.fullName}](${SITE.url}/repo/${r.owner}/${r.name}) | ${label(r)} | ${formatDelta(r.delta24h)}${r.velocityEstimated ? " (est.)" : ""} | \`${s}\` |`);
    });
  }
  lines.push("", `Questions or a wrong badge: ${SITE.sponsorEmail}`, "");
  return lines.join("\n");
}
