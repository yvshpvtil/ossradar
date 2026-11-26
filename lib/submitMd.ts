import { CATEGORIES } from "@/lib/categories";
import { getData, getRepos } from "@/lib/data";
import { SITE } from "@/lib/site";

const ISSUE = "https://github.com/yvshpvtil/ossradar/issues/new";

/** Prefilled GitHub issue URL for suggesting one repo (same template and fields as the /submit form). */
export function submitIssueUrl(owner: string, name: string, why = ""): string {
  const full = `${owner}/${name}`;
  return `${ISSUE}?template=submit-repo.yml&title=${encodeURIComponent(`Submit: ${full}`)}&repo=${encodeURIComponent(`https://github.com/${full}`)}&why=${encodeURIComponent(why)}`;
}

/**
 * Markdown twin of /submit (/submit.md), for agents asked "how do I get my repo listed on OSS Radar"
 * or "is my repo tracked": how repos are found automatically, how to check if one is already tracked
 * (/api/v1/repo 200 vs 404), the exact prefilled GitHub issue URL pattern and the email fallback,
 * what is and isn't accepted, and the newest tracked repos as examples. Same facts as the HTML page
 * (the form there is client-side, so agents fetching /submit got no way to act); rebuilt hourly.
 */
export function submitMarkdown(): string {
  const repos = getRepos();
  const newest = [...repos].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const cat = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
  const lines: string[] = [
    `# Submit a repo to ${SITE.name}`,
    "",
    `Suggest an open-source AI, LLM, agent, MCP or developer-tool repo for ${SITE.name} to track. Submissions are free and reviewed by hand. Once added, a repo is ranked like every other one, purely by the GitHub stars it gains, so submitting doesn't buy a better spot. HTML page with the form: ${SITE.url}/submit`,
    "",
    `Data as of ${getData().generatedAt} (UTC); ${repos.length} repos tracked right now.`,
    "",
    "## 1. Check whether the repo is already tracked",
    "",
    `- \`GET ${SITE.url}/api/v1/repo/{owner}/{name}\` returns **200** with its stats if it is tracked and **404** if not (free, no key; docs: ${SITE.url}/developers.md).`,
    `- A tracked repo's page is ${SITE.url}/repo/{owner}/{name} (Markdown: ${SITE.url}/repo/{owner}/{name}.md). If it is already tracked, there is nothing to submit.`,
    "",
    "## 2. Submit it",
    "",
    "Open a short public GitHub issue (needs a free GitHub account). This URL pattern pre-fills the submission form; replace {owner} and {name}, and optionally put a URL-encoded one-line description in `why`:",
    "",
    "```",
    `${ISSUE}?template=submit-repo.yml&title=Submit:%20{owner}/{name}&repo=https://github.com/{owner}/{name}&why=`,
    "```",
    "",
    `Example: ${submitIssueUrl("octocat", "hello-world", "A tiny CLI that greets you")}`,
    "",
    `No GitHub account? Email **hello@ossradar.net** with the subject \`Submit: {owner}/{name}\` and the repo URL in the body.`,
    "",
    "Requirements:",
    "",
    "- A public GitHub repo with an open-source license.",
    "- AI, LLM, agent, MCP or developer-tool related.",
    "",
    "## How repos get on the site",
    "",
    `Most repos are found automatically. Every hour, ${SITE.name} searches GitHub for two kinds of projects: young repos created in the last 90 days that already have at least 25 stars and carry topics like LLM, AI agents, MCP, RAG, local LLMs, coding agents, developer tools, CLI, self-hosted, DevOps or observability; and established repos with 2,000+ stars in those areas that were updated in the past week. It then keeps the ${repos.length.toLocaleString("en-US")} repos gaining the most stars this week.`,
    "",
    "A submission helps when a project is new, has few GitHub topics, or sits just outside those searches. Once approved, it is tracked every hour, gets its own repo page with star history, and shows up in rankings only when its real star growth earns a spot. Approval doesn't place it on the leaderboard by itself.",
    "",
    "## What isn't accepted",
    "",
    "- Archived repos, private repos and anything that isn't on GitHub.",
    "- Projects that aren't software: reading lists, life-advice guides, recipes and similar collections.",
    "- Adult or NSFW projects, even AI ones, since this is a work-safe site.",
    `- Paid placement. Sponsorship is a separate, clearly labeled slot (${SITE.url}/sponsor.md) and never changes a repo's rank.`,
    "",
    "## Examples of what fits: newest tracked repos",
    "",
    ...newest.map((r) => `- [${r.fullName}](${SITE.url}/repo/${r.fullName}) (${cat(r.category)}, ${r.stars.toLocaleString("en-US")} stars, created ${r.createdAt.slice(0, 10)})`),
    "",
    `More: new repos by launch day ${SITE.url}/new.md, categories ${SITE.url}/category.md, methodology ${SITE.url}/about.md.`,
    "",
  ];
  return lines.join("\n");
}
