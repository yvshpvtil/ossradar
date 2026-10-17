import { NextResponse, type NextRequest } from "next/server";
import { getCategory } from "@/lib/categories";
import { getRepo } from "@/lib/data";
import { getLanding } from "@/lib/landing";
import { getLanguage } from "@/lib/languages";
import { hasTopicPage } from "@/lib/topics";
import { hasAlternativesPage } from "@/lib/alternatives";

/** First day that can be archived: the day after the first snapshot (2026-10-13). */
const FIRST_ARCHIVE_DAY = "2026-10-14";

/**
 * With Cache Components, unknown dynamic params render on request and the static shell
 * streams before the page calls notFound(), so they'd answer 200 + noindex. Reject unknown
 * slugs here, before rendering, so crawlers get a real 404. Also 308 wrong-cased repo URLs
 * to the canonical path.
 */
export function proxy(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const notFound = () => NextResponse.rewrite(new URL("/__not-found", req.url), { status: 404 });

  if (parts[0] === "repo") {
    if (parts.length < 3) return notFound();
    const repo = getRepo(parts[1], parts[2]);
    if (!repo) return notFound();
    if (parts.length === 3 && (repo.owner !== parts[1] || repo.name !== parts[2])) {
      const url = req.nextUrl.clone();
      url.pathname = `/repo/${repo.owner}/${repo.name}`;
      return NextResponse.redirect(url, 308);
    }
  } else if (parts[0] === "alternatives" && parts.length > 1) {
    // Bare /alternatives is the index page; only owner/name paths are checked.
    const repo = parts.length === 3 ? getRepo(parts[1], parts[2]) : undefined;
    if (!repo || !hasAlternativesPage(repo)) return notFound();
    if (repo.owner !== parts[1] || repo.name !== parts[2]) {
      const url = req.nextUrl.clone();
      url.pathname = `/alternatives/${repo.owner}/${repo.name}`;
      return NextResponse.redirect(url, 308);
    }
  } else if (parts[0] === "category") {
    if (!parts[1] || !getCategory(parts[1])) return notFound();
  } else if (parts[0] === "trending") {
    if (!parts[1] || !getLanding(parts[1])) return notFound();
  } else if (parts[0] === "language" && parts.length > 1) {
    // Bare /language is the index page; only hub slugs are checked.
    if ((parts.length > 2 && parts[2] !== "opengraph-image") || !getLanguage(parts[1])) return notFound();
  } else if (parts[0] === "topic" && parts.length > 1) {
    // Bare /topic is the index page; only hub slugs are checked.
    if ( (parts.length > 2 && parts[2] !== "opengraph-image") || !hasTopicPage(parts[1])) return notFound();
  } else if (parts[0] === "daily" && parts.length > 1) {
    // Archive days are completed UTC days from FIRST_ARCHIVE_DAY up to yesterday (snapshot files aren't readable here).
    const d = parts[1];
    const today = new Date().toISOString().slice(0, 10);
    if (parts.length > 2 || !/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d)) || d < FIRST_ARCHIVE_DAY || d >= today) return notFound();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/repo/:path*", "/alternatives/:path*", "/category/:path*", "/trending/:path*", "/language/:path*", "/topic/:path*", "/daily/:path*"],
};
