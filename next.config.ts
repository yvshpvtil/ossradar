import type { NextConfig } from "next";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { LANGUAGE_TOPICS, TOPIC_ALIASES } from "./lib/topicAliases";

/**
 * Newest completed archive day, same rule as getArchiveDays() in lib/daily.ts (a snapshot before
 * today's with the previous day's snapshot present). Read at build; the hourly rebuild keeps it fresh.
 */
function latestArchiveDay(): string | null {
  try {
    const dir = path.join(process.cwd(), "data", "snapshots");
    const today = (JSON.parse(readFileSync(path.join(process.cwd(), "data", "repos.json"), "utf8")) as { snapshotDate?: string }).snapshotDate ?? "9999-12-31";
    const have = new Set(readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10)));
    const prev = (d: string) => new Date(Date.parse(d + "T00:00:00Z") - 86_400_000).toISOString().slice(0, 10);
    return [...have].filter((d) => d < today && have.has(prev(d))).sort().pop() ?? null;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Drop the "X-Powered-By: Next.js" header from every response: it carries no value for visitors or
  // crawlers and needlessly fingerprints the stack.
  poweredByHeader: false,
  // data/ is installed as the local package "ossradar-data" (file:./data). Keeping it external means
  // the server bundle holds one copy of each JSON file instead of one per Turbopack chunk group
  // (repos.json alone was inlined 3x), which keeps the Cloudflare Worker under its size limit.
  serverExternalPackages: ["ossradar-data"],
  // Singular/plural topic twins share one hub page (see lib/topicAliases.ts).
  async redirects() {
    return [
      // www.ossradar.net served the whole site with 200s (canonicals pointed at the apex, but
      // crawlers still fetched duplicates). Send every www URL to the same path on the apex.
      { source: "/:path*", has: [{ type: "host", value: "www.ossradar.net" }], destination: "https://ossradar.net/:path*", permanent: true },
      // Feed readers and crawlers probe common feed paths; the one feed lives at /rss.xml.
      // /atom.xml (Jekyll/Hexo convention) and /index.xml (Hugo convention) are probed the same way.
      ...["/feed", "/feed.xml", "/rss", "/atom.xml", "/index.xml"].map((source) => ({ source, destination: "/rss.xml", permanent: true })),
      // Static-site habits and link checkers request the homepage as a file or as /home, which 404ed.
      ...["/index.html", "/index.htm", "/home"].map((source) => ({ source, destination: "/", permanent: true })),
      // Bare /sitemap (no extension) is a common guess by audit tools and people.
      { source: "/sitemap", destination: "/sitemap.xml", permanent: true },
      // Visitors (often from social posts) and crawlers guess obvious paths for the newsletter, its archive,
      // the leaderboard and the FAQ, which 404ed. Send each to where that thing actually lives.
      ...["/newsletter", "/subscribe", "/signup"].map((source) => ({ source, destination: "/#subscribe", permanent: true })),
      ...["/archive", "/archives"].map((source) => ({ source, destination: "/daily", permanent: true })),
      ...["/leaderboard", "/search"].map((source) => ({ source, destination: "/", permanent: true })),
      { source: "/faq", destination: "/about#faq", permanent: true },
      // Would-be sponsors guess the usual "advertise with us" paths (/sponsors, /advertise, /pricing...),
      // which 404ed and lost the visitor most likely to buy a slot. The one sales page is /sponsor.
      ...["/sponsors", "/sponsorship", "/sponsorships", "/advertise", "/advertising", "/ads", "/pricing"].map((source) => ({ source, destination: "/sponsor", permanent: true })),
      // "/repos" and "/projects" mean the list of tracked repos, which is the homepage leaderboard.
      ...["/repos", "/projects"].map((source) => ({ source, destination: "/", permanent: true })),
      // Stable "latest" links for the daily archive (newsletter footers, social posts, agents) that always
      // land on the newest completed day. Temporary (307) because the target moves every day.
      ...((day) => day ? [
        ...["/daily/latest", "/latest"].map((source) => ({ source, destination: `/daily/${day}`, permanent: false })),
        { source: "/daily/latest.md", destination: `/daily/${day}.md`, permanent: false },
      ] : [])(latestArchiveDay()),
      // /today guesses mean today's leaderboard, which is the homepage.
      { source: "/today", destination: "/", permanent: true },
      // iOS Safari, link-preview fetchers and favicon crawlers request the legacy root paths directly
      // (ignoring <link rel="apple-touch-icon">), which 404ed. The icon lives at /apple-icon.png.
      ...["/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"].map((source) => ({ source, destination: "/apple-icon.png", permanent: true })),
      // SEO crawlers and audit tools probe WordPress/Yoast-style sitemap index paths before reading
      // robots.txt; the single sitemap lives at /sitemap.xml.
      ...["/sitemap_index.xml", "/sitemap-index.xml"].map((source) => ({ source, destination: "/sitemap.xml", permanent: true })),
      // Older PWA tooling and favicon crawlers probe /manifest.json; the manifest is /manifest.webmanifest.
      { source: "/manifest.json", destination: "/manifest.webmanifest", permanent: true },
      // URL-trimming visitors and crawlers hit the bare parents of our routes, which 404ed: plural hub
      // names, /repo (repo pages live at /repo/owner/name; the leaderboard is the index of them) and the
      // API roots (agents probing /api/v1 want the OpenAPI spec; people at /api want the docs).
      ...(["category", "topic", "language"] as const).map((hub) => ({ source: `/${hub === "category" ? "categories" : `${hub}s`}`, destination: `/${hub}`, permanent: true })),
      { source: "/repo", destination: "/", permanent: true },
      { source: "/api/v1", destination: "/api/v1/openapi.json", permanent: true },
      { source: "/api", destination: "/about#api", permanent: true },
      ...Object.entries(TOPIC_ALIASES).map(([alias, slug]) => ({ source: `/topic/${alias}`, destination: `/topic/${slug}`, permanent: true })),
      // Language-name topics (python, golang...) have no topic hub of their own; the language hub is the page for them.
      ...Object.entries(LANGUAGE_TOPICS).map(([tag, lang]) => ({ source: `/topic/${tag}`, destination: `/language/${lang}`, permanent: true })),
    ];
  },
  // Markdown twins of /hacker-news, /new and the homepage (/index.md) for chatbots and agents (app/md/hacker-news, app/md/new, app/md/home). The other
  // .md twins live under proxy.ts's matcher; neither page has a dynamic segment, so plain rewrites do it.
  async rewrites() {
    return { beforeFiles: [{ source: "/hacker-news.md", destination: "/md/hacker-news" }, { source: "/new.md", destination: "/md/new" }, { source: "/index.md", destination: "/md/home" }], afterFiles: [], fallback: [] };
  },
  partialPrefetching: true,
  // Tailwind CSS is served as one cacheable stylesheet instead of experimental.inlineCss: inlining put
  // the ~42 KB (raw) stylesheet into every HTML response three times (a <style> tag plus twice in the
  // RSC payload), so each page was ~126 KB heavier for crawlers and repeat visitors.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
