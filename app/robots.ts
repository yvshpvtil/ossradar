import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** AI crawlers and answer engines we explicitly welcome (search, assistants and training). */
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  // Internal endpoints stay out of crawls; the public JSON API (/api/v1/) stays crawlable.
  const disallow = ["/api/subscribe"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_BOTS, allow: "/", disallow },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
