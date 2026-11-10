import { NextResponse, type NextRequest } from "next/server";
import { canonicalTopic } from "@/lib/topicAliases";
import routes from "ossradar-data/routes.json";

/**
 * Which repo, hub and alternatives pages exist, precomputed at prebuild by scripts/routes.ts from
 * the same lib functions the pages use (getRepo, getCategory, getLanding, getLanguage, hasTopicPage,
 * hasAlternativesPage, retired repos). Data only changes with a rebuild, so this answers exactly as
 * calling them here would, but keeps repos.json and the data pipeline out of the proxy bundle.
 */
const REPOS: Record<string, string> = routes.repos;
const ALTERNATIVES = new Set<string>(routes.alternatives);
const CATEGORIES = new Set<string>(routes.categories);
const LANDINGS = new Set<string>(routes.landings);
const LANGUAGES = new Set<string>(routes.languages);
const TOPICS = new Set<string>(routes.topics);
const REPO_LANGUAGES = new Set<string>(routes.repoLanguages);
const REPO_TOPICS = new Set<string>(routes.repoTopics);

/** Repos seen in a daily snapshot that have since left the tracked set (written by scripts/retired.ts at prebuild). */
const RETIRED = new Set<string>(routes.retired);

/** Tracked repo by owner/name, case-insensitive, with its canonical casing (same as getRepo). */
function getRepo(owner: string, name: string): { owner: string; name: string; full: string } | undefined {
  const full = `${owner}/${name}`.toLowerCase();
  const canonical = Object.hasOwn(REPOS, full) ? REPOS[full] : undefined;
  if (!canonical) return undefined;
  const [o, n] = canonical.split("/");
  return { owner: o, name: n, full };
}
const hasAlternativesPage = (repo: { full: string }) => ALTERNATIVES.has(repo.full);

/**
 * Archived /daily/[date] pages, from the same getArchiveDays() the page uses. A date-range guess
 * (before today's UTC date) let the just-finished day through for the hours before its closing
 * snapshot existed, so it rendered "Page not found" with a 200 (soft 404) instead of a real 404.
 */
const DAILY_DAYS = new Set<string>(routes.dailyDays ?? []);
const isArchiveDay = (d: string) => DAILY_DAYS.has(d);

/** Single-slug hub sections (lowercase slugs) and how to tell a real hub. */
const HUBS: Record<string, (slug: string) => boolean> = {
  category: (s) => CATEGORIES.has(s),
  trending: (s) => LANDINGS.has(s),
  language: (s) => LANGUAGES.has(s),
  topic: (s) => TOPICS.has(s),
  daily: isArchiveDay,
};

/**
 * Language and topic hubs come and go with the tracked set (a hub needs 8 repos in a language or
 * 10 sharing a topic). A slug that was a hub, or could be one again, because some tracked repo
 * still uses that language or topic, gets a temporary redirect to the section index instead of a
 * hard 404, so old links and crawlers land on the live list and the URL is kept for when it returns.
 */
const DORMANT_HUBS: Record<string, (slug: string) => boolean> = {
  language: (s) => REPO_LANGUAGES.has(s),
  topic: (s) => REPO_TOPICS.has(canonicalTopic(s)),
};

/** Hub sections whose slug card moved to /opengraph-image/card (per-hub alt text via generateImageMetadata). */
const CARD_ID_HUBS = new Set(["category", "trending", "language", "topic", "daily"]);

/** Sections with a bare index page. */
const INDEXES = new Set(["alternatives", "category", "language", "topic", "daily"]);

/** Index pages with their own Open Graph card (app/{section}/opengraph-image.tsx). */
const INDEX_CARDS = new Set(["alternatives", "category", "language", "topic", "daily"]);

/** Internal route folders under app/md (one per .md twin type). */
const MD_TWINS = new Set(["repo", "alternatives", "category", "trending", "language", "topic", "daily", "hacker-news"]);

const escapeHtml = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Body of the 410 answer for a repo that has left the tracked set. */
function gonePage(fullName: string): string {
  const name = escapeHtml(fullName);
  const gh = `https://github.com/${fullName.split("/").map(encodeURIComponent).join("/")}`;
  const link = "color:#4f46e5;text-decoration:none";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} is no longer tracked · OSS Radar</title><meta name="robots" content="noindex, follow">
<link rel="icon" href="/favicon.ico"></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#18181b;background:#fff">
<main style="max-width:560px;margin:0 auto;padding:72px 20px;text-align:center;line-height:1.6">
<p style="margin:0 0 8px;font-weight:600"><a href="/" style="${link}">OSS Radar</a></p>
<h1 style="font-size:28px;margin:0 0 12px">${name} is no longer on the radar</h1>
<p style="color:#52525b;margin:0 0 24px">OSS Radar tracked this repo when it was rising fast. It has since dropped out of the tracked set, so its page was retired. The project itself is still on GitHub.</p>
<p style="margin:0 0 8px"><a href="${gh}" style="${link}" rel="nofollow">View ${name} on GitHub</a></p>
<p style="margin:0"><a href="/" style="${link}">Today's leaderboard</a> · <a href="/new" style="${link}">New repos</a> · <a href="/daily" style="${link}">Daily top 25 archive</a> · <a href="/category" style="${link}">Categories</a></p>
</main></body></html>`;
}

/**
 * With Cache Components, unknown dynamic params render on request and the static shell
 * streams before the page calls notFound(), so they'd answer 200 + noindex. Reject unknown
 * slugs here, before rendering, so crawlers get a real 404. Also 308 wrong-cased URLs
 * (section folder, hub slug, repo owner/name) to the canonical lowercase path.
 */
export function proxy(req: NextRequest) {
  const raw = req.nextUrl.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const notFound = () => NextResponse.rewrite(new URL("/__not-found", req.url), { status: 404 });
  // A repo seen in an earlier snapshot that has since dropped out of the tracked set answers
  // 410 Gone, so search engines drop the old URL instead of retrying it as a 404. A rewrite's
  // status is overridden by the page it renders, so this is a small standalone page instead.
  const gone = (fullName: string) =>
    new NextResponse(gonePage(fullName), {
      status: 410,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex, follow",
        "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  // Route folders and hub slugs are lowercase, but the matcher (and the dynamic routes behind it)
  // also accept other casings, so /Category/mcp or /TOPIC/mcp would serve a duplicate 200 while
  // /topic/MCP 404s. Look everything up lowercased (repo owner/name stay as typed; getRepo is
  // case-insensitive) and 308 any wrong-cased page URL to its canonical path.
  const section = (raw[0] ?? "").toLowerCase();
  const slug = (raw[1] ?? "").toLowerCase();
  const parts = [section, ...raw.slice(1)];
  const redirectTo = (pathname: string) => {
    const url = req.nextUrl.clone();
    url.pathname = pathname;
    return NextResponse.redirect(url, 308);
  };
  const redirectTemp = (pathname: string) => {
    const url = req.nextUrl.clone();
    url.pathname = pathname;
    return NextResponse.redirect(url, 307);
  };

  // An index page's own card, e.g. /topic/opengraph-image (not a hub slug), when requested exactly as generated.
  if (raw.length === 2 && raw[0] === section && raw[1] === "opengraph-image" && INDEX_CARDS.has(section)) return NextResponse.next();

  // The internal /md/... route handlers behind the .md twins (proxy rewrites and the /hacker-news.md
  // rewrite in next.config.ts) also answered 200 when hit directly, a duplicate URL for every twin.
  // Rewrites don't re-enter the proxy, so only direct hits land here: 308 them to the public .md URL
  // (which validates the slug and casing itself); a bare /md is a 404.
  if (section === "md") {
    if (parts.length < 2 || !MD_TWINS.has(raw[1])) return notFound();
    return redirectTo(`/${raw.slice(1).map(encodeURIComponent).join("/")}.md`);
  }

  if (section === "repo") {
    if (parts.length < 3) return notFound();
    // Markdown twin for chatbots and agents: /repo/{owner}/{name}.md (canonical casing enforced).
    if (parts.length === 3 && raw[0] === "repo" && /\.md$/i.test(parts[2])) {
      const md = getRepo(parts[1], parts[2].slice(0, -3));
      if (!md) return notFound();
      const want = `/repo/${md.owner}/${md.name}.md`;
      if (`/${raw.join("/")}` !== want) return redirectTo(want);
      return NextResponse.rewrite(new URL(`/md/repo/${md.owner}/${md.name}`, req.url));
    }
    const repo = getRepo(parts[1], parts[2]);
    if (!repo) return parts.length === 3 && RETIRED.has(`${parts[1]}/${parts[2]}`.toLowerCase()) ? gone(`${parts[1]}/${parts[2]}`) : notFound();
    const canonical = `/repo/${repo.owner}/${repo.name}`;
    if (parts.length === 3 && `/${raw.join("/")}` !== canonical) return redirectTo(canonical);
    if (parts.length > 3 && raw[0] !== "repo") return notFound();
    // The card moved to /opengraph-image/card (per-repo alt text via generateImageMetadata);
    // previews cached with the old card URL follow it instead of breaking.
    if (parts.length === 4 && parts[3] === "opengraph-image") return redirectTo(`${canonical}/opengraph-image/card`);
  } else if (section === "alternatives" && parts.length === 3 && /\.md$/i.test(parts[2])) {
    // Markdown twin for chatbots and agents: /alternatives/{owner}/{name}.md (canonical casing enforced).
    const md = getRepo(parts[1], parts[2].slice(0, -3));
    if (!md || !hasAlternativesPage(md)) return notFound();
    const want = `/alternatives/${md.owner}/${md.name}.md`;
    if (`/${raw.join("/")}` !== want) return redirectTo(want);
    return NextResponse.rewrite(new URL(`/md/alternatives/${md.owner}/${md.name}`, req.url));
  } else if (section === "alternatives" && parts.length > 1) {
    // Bare /alternatives is the index page; only owner/name paths are checked.
    // Owner/name, plus that page's Open Graph card route.
    const isCard = parts[3] === "opengraph-image" && raw[0] === "alternatives";
    const ok = parts.length === 3 || (isCard && (parts.length === 4 || (parts.length === 5 && parts[4] === "card")));
    const repo = ok ? getRepo(parts[1], parts[2]) : undefined;
    // A tracked repo whose alternatives page was retired (too few close matches) sends visitors and
    // old links to its repo page, which still lists related repos, instead of a dead end.
    if (repo && parts.length === 3 && !hasAlternativesPage(repo)) return redirectTo(`/repo/${repo.owner}/${repo.name}`);
    if (!repo || !hasAlternativesPage(repo)) return notFound();
    const canonical = `/alternatives/${repo.owner}/${repo.name}`;
    if (parts.length === 3 && `/${raw.join("/")}` !== canonical) return redirectTo(canonical);
    // The card moved to /opengraph-image/card (per-page alt text via generateImageMetadata);
    // previews cached with the old card URL follow it instead of breaking.
    if (parts.length === 4) return redirectTo(`${canonical}/opengraph-image/card`);
  } else if (section === "trending" && parts.length === 1) {
    // Bare /trending has no page of its own; the homepage is the trending leaderboard.
    return redirectTo("/");
  } else if (parts.length === 1 && raw[0] !== section && INDEXES.has(section)) {
    // Wrong-cased index page, e.g. /Category.
    return redirectTo(`/${section}`);
  } else if (section === "trending" && parts.length === 2 && /\.md$/i.test(raw[1])) {
    // Markdown twin for chatbots and agents: /trending/{slug}.md (lowercase path enforced).
    const view = slug.slice(0, -3);
    if (!LANDINGS.has(view)) return notFound();
    if (`/${raw.join("/")}` !== `/trending/${view}.md`) return redirectTo(`/trending/${view}.md`);
    return NextResponse.rewrite(new URL(`/md/trending/${view}`, req.url));
  } else if (section === "category" && parts.length === 2 && /\.md$/i.test(raw[1])) {
    // Markdown twin for chatbots and agents: /category/{slug}.md (lowercase path enforced).
    const hub = slug.slice(0, -3);
    if (!CATEGORIES.has(hub)) return notFound();
    if (`/${raw.join("/")}` !== `/category/${hub}.md`) return redirectTo(`/category/${hub}.md`);
    return NextResponse.rewrite(new URL(`/md/category/${hub}`, req.url));
  } else if (section === "language" && parts.length === 2 && /\.md$/i.test(raw[1])) {
    // Markdown twin for chatbots and agents: /language/{slug}.md (lowercase path enforced).
    const hub = slug.slice(0, -3);
    if (!LANGUAGES.has(hub)) return notFound();
    if (`/${raw.join("/")}` !== `/language/${hub}.md`) return redirectTo(`/language/${hub}.md`);
    return NextResponse.rewrite(new URL(`/md/language/${hub}`, req.url));
  } else if (section === "topic" && parts.length === 2 && /\.md$/i.test(raw[1])) {
    // Markdown twin for chatbots and agents: /topic/{slug}.md (lowercase path enforced; a
    // singular/plural alias of a hub 308s to the hub's own .md).
    const hub = canonicalTopic(slug.slice(0, -3));
    if (!TOPICS.has(hub)) return notFound();
    if (`/${raw.join("/")}` !== `/topic/${hub}.md`) return redirectTo(`/topic/${hub}.md`);
    return NextResponse.rewrite(new URL(`/md/topic/${hub}`, req.url));
  } else if (section === "daily" && parts.length === 2 && /\.md$/i.test(raw[1])) {
    // Markdown twin for chatbots and agents: /daily/{YYYY-MM-DD}.md (lowercase path enforced).
    const day = slug.slice(0, -3);
    if (!isArchiveDay(day)) return notFound();
    if (`/${raw.join("/")}` !== `/daily/${day}.md`) return redirectTo(`/daily/${day}.md`);
    return NextResponse.rewrite(new URL(`/md/daily/${day}`, req.url));
  } else if (parts.length > 1 && Object.hasOwn(HUBS, section)) {
    // Bare /category, /language, /topic and /daily are index pages; only hub paths are checked:
    // the slug page, plus its Open Graph card route when requested exactly as generated.
    const withId = CARD_ID_HUBS.has(section);
    const cardPath = parts[2] === "opengraph-image" && raw[0] === section && raw[1] === slug;
    const card = cardPath && (parts.length === 3 || (withId && parts.length === 4 && parts[3] === "card"));
    if (parts.length === 2 && !HUBS[section](slug) && DORMANT_HUBS[section]?.(slug)) return redirectTemp(`/${section}`);
    if ((parts.length > 2 && !card) || !HUBS[section](slug)) return notFound();
    if (!card && raw[0] + "/" + raw[1] !== `${section}/${slug}`) return redirectTo(`/${section}/${slug}`);
    // Previews cached with the old card URL follow it to /opengraph-image/card instead of breaking.
    if (card && withId && parts.length === 3) return redirectTo(`/${section}/${slug}/opengraph-image/card`);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/md/:path*", "/repo/:path*", "/alternatives/:path*", "/category/:path*", "/trending/:path*", "/language/:path*", "/topic/:path*", "/daily/:path*"],
};
