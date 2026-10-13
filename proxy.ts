import { NextResponse, type NextRequest } from "next/server";
import { getCategory } from "@/lib/categories";
import { getRepo } from "@/lib/data";
import { getLanding } from "@/lib/landing";

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
  } else if (parts[0] === "category") {
    if (!parts[1] || !getCategory(parts[1])) return notFound();
  } else if (parts[0] === "trending") {
    if (!parts[1] || !getLanding(parts[1])) return notFound();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/repo/:path*", "/category/:path*", "/trending/:path*"],
};
