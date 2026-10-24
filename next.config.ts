import type { NextConfig } from "next";
import { TOPIC_ALIASES } from "./lib/topicAliases";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Singular/plural topic twins share one hub page (see lib/topicAliases.ts).
  async redirects() {
    return [
      // www.ossradar.net served the whole site with 200s (canonicals pointed at the apex, but
      // crawlers still fetched duplicates). Send every www URL to the same path on the apex.
      { source: "/:path*", has: [{ type: "host", value: "www.ossradar.net" }], destination: "https://ossradar.net/:path*", permanent: true },
      // Feed readers and crawlers probe common feed paths; the one feed lives at /rss.xml.
      ...["/feed", "/feed.xml", "/rss"].map((source) => ({ source, destination: "/rss.xml", permanent: true })),
      ...Object.entries(TOPIC_ALIASES).map(([alias, slug]) => ({ source: `/topic/${alias}`, destination: `/topic/${slug}`, permanent: true })),
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
