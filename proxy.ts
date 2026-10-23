import { NextResponse, type NextRequest } from "next/server";
import { getCategory } from "@/lib/categories";
import { getRepo } from "@/lib/data";
import { getLanding } from "@/lib/landing";
import { getLanguage } from "@/lib/languages";
import { hasTopicPage } from "@/lib/topics";
import { hasAlternativesPage } from "@/lib/alternatives";

/** First day that can be archived: the day after the first snapshot (2026-10-13). */
const FIRST_ARCHIVE_DAY = "2026-10-14";

/** Completed UTC archive days: FIRST_ARCHIVE_DAY up to yesterday (snapshot files aren't readable here). */
const isArchiveDay = (d: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && d >= FIRST_ARCHIVE_DAY && d < new Date().toISOString().slice(0, 10);

/** Single-slug hub sections (lowercase slugs) and how to tell a real hub. */
const HUBS: Record<string, (slug: string) => boolean> = {
  category: (s) => Boolean(getCategory(s)),
  trending: (s) => Boolean(getLanding(s)),
  language: (s) => Boolean(getLanguage(s)),
  topic: (s) => hasTopicPage(s),
  daily: isArchiveDay,
};

/** Sections with a bare index page. */
const INDEXES = new Set(["alternatives", "category", "language", "topic", "daily"]);

/**
 * With Cache Components, unknown dynamic params render on request and the static shell
 * streams before the page calls notFound(), so they'd answer 200 + noindex. Reject unknown
 * slugs here, before rendering, so crawlers get a real 404. Also 308 wrong-cased URLs
 * (section folder, hub slug, repo owner/name) to the canonical lowercase path.
 */
export function proxy(req: NextRequest) {
  const raw = req.nextUrl.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const notFound = () => NextResponse.rewrite(new URL("/__not-found", req.url), { status: 404 });
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

  if (section === "repo") {
    if (parts.length < 3) return notFound();
    const repo = getRepo(parts[1], parts[2]);
    if (!repo) return notFound();
    const canonical = `/repo/${repo.owner}/${repo.name}`;
    if (parts.length === 3 && `/${raw.join("/")}` !== canonical) return redirectTo(canonical);
    if (parts.length > 3 && raw[0] !== "repo") return notFound();
  } else if (section === "alternatives" && parts.length > 1) {
    // Bare /alternatives is the index page; only owner/name paths are checked.
    // Owner/name, plus that page's Open Graph card route.
    const ok = parts.length === 3 || (parts.length === 4 && parts[3] === "opengraph-image" && raw[0] === "alternatives");
    const repo = ok ? getRepo(parts[1], parts[2]) : undefined;
    if (!repo || !hasAlternativesPage(repo)) return notFound();
    const canonical = `/alternatives/${repo.owner}/${repo.name}`;
    if (parts.length === 3 && `/${raw.join("/")}` !== canonical) return redirectTo(canonical);
  } else if (section === "trending" && parts.length === 1) {
    // Bare /trending has no page of its own; the homepage is the trending leaderboard.
    return redirectTo("/");
  } else if (parts.length === 1 && raw[0] !== section && INDEXES.has(section)) {
    // Wrong-cased index page, e.g. /Category.
    return redirectTo(`/${section}`);
  } else if (parts.length > 1 && Object.hasOwn(HUBS, section)) {
    // Bare /category, /language, /topic and /daily are index pages; only hub paths are checked:
    // the slug page, plus its Open Graph card route when requested exactly as generated.
    const card = parts.length === 3 && parts[2] === "opengraph-image" && raw[0] === section && raw[1] === slug;
    if ((parts.length > 2 && !card) || !HUBS[section](slug)) return notFound();
    if (!card && raw[0] + "/" + raw[1] !== `${section}/${slug}`) return redirectTo(`/${section}/${slug}`);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/repo/:path*", "/alternatives/:path*", "/category/:path*", "/trending/:path*", "/language/:path*", "/topic/:path*", "/daily/:path*"],
};
