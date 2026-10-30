import type { Repo } from "./types";
import { formatDelta, formatNumber } from "./format";
import { SITE } from "./site";

export const abs = (path: string) => `${SITE.url}${path === "/" ? "" : path}`;

/** Stable node ids so every page's isPartOf/publisher points at the same WebSite and Organization. */
export const WEBSITE_ID = `${SITE.url}/#website`;
export const ORGANIZATION_ID = `${SITE.url}/#organization`;

/** Compact WebSite reference for a page node's isPartOf (same @id as the sitewide WebSite node). */
export const websiteRef = { "@type": "WebSite", "@id": WEBSITE_ID, name: SITE.name, url: SITE.url };

export const repoPath = (r: Pick<Repo, "owner" | "name">) => `/repo/${r.owner}/${r.name}`;

/** <title> for a repo page. The layout template appends " · OSS Radar" (12 chars);
 *  keep the rendered title around Google's ~60-char SERP limit. Prefer owner/name;
 *  drop the owner when the full form would overflow. */
export function repoPageTitle(repo: Pick<Repo, "fullName" | "name" | "delta7d">): string {
  const delta = formatDelta(repo.delta7d);
  // Layout appends " · OSS Radar" (12 chars), so 48 keeps the rendered title within ~60.
  // Long repo names step down: drop the owner, then the word "stars", then the growth phrase.
  const options = [
    `${repo.fullName}: ${delta} stars this week`,
    `${repo.name}: ${delta} stars this week`,
    `${repo.name}: ${delta} this week`,
  ];
  return options.find((t) => t.length <= 48) ?? repo.name;
}

/** Alternatives page <title> sized for Google's ~60-char SERP limit (layout adds " · OSS Radar", 12 chars). */
export function alternativesPageTitle(repoName: string, count: number): string {
  const options = [
    `${count} open-source ${repoName} alternatives on GitHub`,
    `${count} open-source ${repoName} alternatives`,
    `Open-source ${repoName} alternatives`,
    `${repoName} alternatives`,
  ];
  return options.find((t) => t.length <= 48) ?? options[options.length - 1];
}

/** Stable @id base for a page node: the page URL (home keeps its trailing slash, like WEBSITE_ID). */
const pageUrlId = (path: string) => (path === "/" ? `${SITE.url}/` : abs(path));

/** @id for a page's own node plus a reference to its BreadcrumbList (same page URL + #breadcrumb),
 *  so each page's JSON-LD blocks form one connected graph. Home has no breadcrumb trail. */
export function pageNodeIds(path: string) {
  return {
    "@id": `${pageUrlId(path)}#webpage`,
    ...(path === "/" ? {} : { breadcrumb: { "@id": `${pageUrlId(path)}#breadcrumb` } }),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrlId(items[items.length - 1].path)}#breadcrumb`,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function itemListLd(name: string, repos: Repo[], limit = 50) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: Math.min(repos.length, limit),
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: repos.slice(0, limit).map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: abs(repoPath(r)),
      name: r.fullName,
    })),
  };
}

/** ItemList for listing pages whose rows aren't plain Repo objects (daily archive, Hacker News).
 *  Items keep the on-page order; url should be absolute. */
/** Strip @context so a JSON-LD node can be nested inside another. */
export function withoutContext<T extends Record<string, unknown>>(ld: T) {
  const out: Record<string, unknown> = { ...ld };
  delete out["@context"];
  return out;
}

export function linkListLd(name: string, items: { name: string; url: string }[], limit = 50) {
  const list = items.slice(0, limit);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: list.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: list.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: it.url, name: it.name })),
  };
}

/** CollectionPage wrapper for a hub/listing page: says what the page is, when its ranking was last
 *  rebuilt (the data snapshot time) and which site it belongs to, with the ranked list as mainEntity. */
export function collectionPageLd(o: { name: string; description: string; path: string; dateModified: string; mainEntity: Record<string, unknown>; ogCard?: boolean }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    ...pageNodeIds(o.path),
    name: o.name,
    description: o.description,
    url: abs(o.path),
    dateModified: o.dateModified,
    inLanguage: "en",
    isPartOf: websiteRef,
    ...(o.ogCard ? { primaryImageOfPage: ogCardLd(o.path) } : {}),
    mainEntity: withoutContext(o.mainEntity),
  };
}

/** Page node for a static page (about, sponsor, submit): what the page is and which site it belongs to.
 *  type "AboutPage" also points `about` at the sitewide Organization node. */
export function staticPageLd(o: { type?: "WebPage" | "AboutPage"; name: string; description: string; path: string }) {
  const type = o.type ?? "WebPage";
  return {
    "@context": "https://schema.org",
    "@type": type,
    ...pageNodeIds(o.path),
    name: o.name,
    description: o.description,
    url: abs(o.path),
    inLanguage: "en",
    isPartOf: websiteRef,
    ...(type === "AboutPage" ? { about: { "@id": ORGANIZATION_ID } } : {}),
  };
}

/**
 * Dataset node for the free hourly data (JSON API + RSS), so dataset search and AI crawlers can
 * find and cite it. Only facts the site already states: what's measured, update cadence, formats, terms.
 */
export function datasetLd(o: { dateModified: string; repoCount: number; firstDay?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE.url}/about#dataset`,
    name: `${SITE.name} GitHub star velocity data`,
    description: `Hourly-updated star velocity for ${o.repoCount} fast-rising open-source AI and developer-tool GitHub repositories: stars gained in the last 24 hours and 7 days, total stars, forks, primary language, category and GitHub topics, computed by diffing hourly and daily star-count snapshots from the GitHub API. The JSON API returns the top 100 repos by 24-hour star gain. Free to use with a link back to ${SITE.url}.`,
    url: abs("/about#api"),
    keywords: ["GitHub", "open source", "star velocity", "trending repositories", "AI", "developer tools", "LLM", "MCP"],
    isAccessibleForFree: true,
    usageInfo: abs("/about#api"),
    creator: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: websiteRef,
    inLanguage: "en",
    dateModified: o.dateModified,
    ...(o.firstDay ? { temporalCoverage: `${o.firstDay}/..` } : {}),
    measurementTechnique: "Diffs of hourly and daily GitHub stargazer counts; repos first seen less than a week ago have estimated gains, flagged as such.",
    variableMeasured: ["stars gained in the last 24 hours", "stars gained in the last 7 days", "total stars", "forks"],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: abs("/api/v1/trending"), name: "Top 100 repos by 24-hour star gain (JSON)" },
      { "@type": "DataDownload", encodingFormat: "application/rss+xml", contentUrl: abs("/rss.xml"), name: "Fastest-rising repos today (RSS)" },
    ],
  };
}

/** ImageObject for a page's own file-based Open Graph card (pages with an opengraph-image route). */
export function ogCardLd(path: string) {
  return { "@type": "ImageObject", url: abs(`${path === "/" ? "" : path}/opengraph-image`), width: 1200, height: 630 };
}

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE.name,
    url: SITE.url,
    email: SITE.sponsorEmail,
    // app/apple-icon.png (180x180): Google wants a crawlable square logo of at least 112x112.
    logo: { "@type": "ImageObject", url: abs("/apple-icon.png"), width: 180, height: 180 },
  },
};

// East Asian wide characters (CJK ideographs, kana, Hangul, full-width forms) render about twice as wide
// as Latin letters, and Google cuts snippets by pixel width, so a 150-char Chinese description fills
// roughly two snippets and pushes the stats sentence out of view.
const WIDE = /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/u;

/** Approximate rendered width in Latin-character units: wide (CJK) characters count as 2. */
export function textWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += WIDE.test(ch) ? 2 : 1;
  return w;
}

/**
 * Like clip(), but measured with textWidth() so CJK text gets about half the characters. Text with no
 * nearby space (Chinese/Japanese) is cut after the last CJK comma/colon/semicolon in the back third,
 * else at a character boundary, instead of falling back to the last ASCII space far earlier.
 */
export function clipWidth(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (textWidth(t) <= max) return t;
  let out = "";
  let w = 0;
  for (const ch of t) {
    const cw = WIDE.test(ch) ? 2 : 1;
    if (w + cw > max - 1) break;
    out += ch;
    w += cw;
  }
  const space = out.search(/\s+\S*$/);
  if (space > out.length * 0.6) return `${out.slice(0, space)}…`;
  const punct = Math.max(...["，", "、", "：", "；", "（"].map((p) => out.lastIndexOf(p)));
  if (punct > out.length * 0.6) return `${out.slice(0, punct)}…`;
  return `${out.replace(/[\s,;:(\-–—/]+$/, "")}…`;
}

/** Trim to a meta-description-friendly length on a word boundary. */
export function clip(s: string, max = 158): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

// Pages that set their own `openGraph` replace the layout's object entirely, which drops the
// root file-based OG image (and siteName/locale/type). Spread these into any page without its own
// opengraph-image file so link previews on X/Slack/LinkedIn still show the card.
export const SITE_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE.name}: fastest-rising open-source AI & dev tools`,
  type: "image/png",
};
export const ogDefaults = { siteName: SITE.name, locale: "en_US", type: "website" as const, images: [SITE_OG_IMAGE] };
// Full image object (not just the URL) so twitter:image:alt, width, height and type are emitted too.
export const twitterImage = { images: [SITE_OG_IMAGE] };

/**
 * Hub meta descriptions: a fixed lead sentence plus the hub's current weekly leader, so the
 * 70+ topic/language hubs don't share one near-identical template. Tries the longest variant
 * that fits `max` (tails are tried in order, longest first) and falls back to the plain lead
 * with the first tail, so nothing gets cut mid-sentence. `leader.label` (altLabel: the project's own
 * spelling, or owner/name for generic or duplicate names) is shown instead of the raw slug when given.
 */
export function hubDescription(lead: string, tails: string[], leader: (Pick<Repo, "name" | "delta7d" | "estimated7d"> & { label?: string }) | undefined, max = 155): string {
  const variants: string[] = [];
  if (leader && leader.delta7d > 0) {
    const gain = `${leader.estimated7d ? "about " : ""}+${formatNumber(leader.delta7d)} stars`;
    const withLeader = `${lead} Leading this week: ${leader.label ?? leader.name} (${gain}).`;
    variants.push(...tails.map((t) => `${withLeader} ${t}`), withLeader);
  }
  variants.push(...tails.map((t) => `${lead} ${t}`));
  for (const v of variants) {
    const t = v.replace(/\s+/g, " ").trim();
    if (t.length <= max) return t;
  }
  return clip(`${lead} ${tails[0] ?? ""}`, max);
}

// RSS autodiscovery. Next.js replaces (not merges) the root layout's `alternates` when a page sets its own,
// so a page passing only { canonical } silently dropped the <link rel="alternate" type="application/rss+xml">.
export const RSS_ALTERNATE = { "application/rss+xml": [{ url: "/rss.xml", title: `${SITE.name} RSS` }] };
export const pageAlternates = (canonical: string) => ({ canonical, types: RSS_ALTERNATE });

/**
 * GitHub descriptions often carry link clutter that reads badly in a search snippet: bare URLs
 * ("DeepTutor: Lifelong Personalized Tutoring. https://deeptutor.info/."), community plugs
 * ("Join our community at https://discord.gg/…"), decorative lead symbols ("⌥ Coding agent…") and
 * wrapping quotes. Used for meta descriptions only; the page itself still shows the description as written.
 */
export function snippetText(s: string): string {
  let t = s
    // A URL plus the label that introduces it ("Join our community at", "Official website:", "link:").
    .replace(/(?:\b(?:join (?:our |the )?(?:community|discord|server)[^.:。]*?|official (?:website|site)|website|homepage|home page|link|docs|paper)\s*:?\s*)?(?:https?:\/\/|www\.)[^\s，。)）]*[^\s，。)）.,;:!?]/gi, "")
    .replace(/\s+/g, " ")
    .replace(/[：:]\s+(?=[（(])/g, "")
    // Separators and colons the removed URL leaves dangling before a sentence end or the end.
    .replace(/\s*[|•·:：\-–—]+\s*(?=[.!?。]|$)/g, "")
    .replace(/\s*[|•·]\s*[|•·]\s*/g, " | ")
    // Sentences emptied to a bare period ("Tutoring. ." or a leading ". The end…"), and separators left opening a sentence.
    .replace(/(^|[.!?。])(?:\s+[.。](?=\s|$))+/g, "$1")
    .replace(/^[.。]\s+/, "")
    .replace(/([.!?。])\s*[|•·]\s*/g, "$1 ")
    .trim();
  // Decorative lead symbols (⌥, ☤, emoji); keep openers that start real text.
  t = t.replace(/^[^\p{L}\p{N}"“'([]+/u, "");
  // A description wrapped whole in quotes: "Vibe-Trading: Your Personal Trading Agent".
  t = t.replace(/^["“]([^"”]+)["”]/, "$1");
  return t.trim();
}

/** Hosts that are never a project's own site: code hosts, papers, video, social and chat. */
const NOT_A_PROJECT_SITE = /(^|\.)(github\.com|gitlab\.com|gitee\.com|arxiv\.org|youtube\.com|youtu\.be|x\.com|twitter\.com|discord\.gg|discord\.com|t\.me|reddit\.com|huggingface\.co|npmjs\.com|pypi\.org|linkedin\.com|medium\.com|bilibili\.com|notion\.site)$/i;

/**
 * The project's own website from its GitHub "homepage" field, when it is one (an http(s) site that
 * isn't GitHub, a paper, a package registry or a social profile), for use in sameAs so search
 * engines and AI tools can tie the page to the project's official site. Otherwise undefined.
 */
export function officialSite(homepage: string | null | undefined, owner?: string): string | undefined {
  if (!homepage?.trim()) return undefined;
  try {
    const u = new URL(homepage.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    // A host's own projects are official there: huggingface/transformers -> huggingface.co/transformers
    // (a personal huggingface.co/<user> profile from anyone else is still skipped).
    if (owner && u.hostname.replace(/^www\./, "").toLowerCase().split(".")[0] === owner.toLowerCase()) return u.href;
    if (NOT_A_PROJECT_SITE.test(u.hostname)) return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}
