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
      ...Object.entries(TOPIC_ALIASES).map(([alias, slug]) => ({ source: `/topic/${alias}`, destination: `/topic/${slug}`, permanent: true })),
    ];
  },
  partialPrefetching: true,
  // ~8 KB of Tailwind CSS: inline it so first paint doesn't wait on a second round trip (render-blocking stylesheet).
  experimental: { inlineCss: true },
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
