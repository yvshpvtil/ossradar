import type { NextConfig } from "next";
import { LANGUAGE_TOPICS, TOPIC_ALIASES } from "./lib/topicAliases";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
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
      ...["/feed", "/feed.xml", "/rss"].map((source) => ({ source, destination: "/rss.xml", permanent: true })),
      // iOS Safari, link-preview fetchers and favicon crawlers request the legacy root paths directly
      // (ignoring <link rel="apple-touch-icon">), which 404ed. The icon lives at /apple-icon.png.
      ...["/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"].map((source) => ({ source, destination: "/apple-icon.png", permanent: true })),
      // SEO crawlers and audit tools probe WordPress/Yoast-style sitemap index paths before reading
      // robots.txt; the single sitemap lives at /sitemap.xml.
      ...["/sitemap_index.xml", "/sitemap-index.xml"].map((source) => ({ source, destination: "/sitemap.xml", permanent: true })),
      // Older PWA tooling and favicon crawlers probe /manifest.json; the manifest is /manifest.webmanifest.
      { source: "/manifest.json", destination: "/manifest.webmanifest", permanent: true },
      ...Object.entries(TOPIC_ALIASES).map(([alias, slug]) => ({ source: `/topic/${alias}`, destination: `/topic/${slug}`, permanent: true })),
      // Language-name topics (python, golang...) have no topic hub of their own; the language hub is the page for them.
      ...Object.entries(LANGUAGE_TOPICS).map(([tag, lang]) => ({ source: `/topic/${tag}`, destination: `/language/${lang}`, permanent: true })),
    ];
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
