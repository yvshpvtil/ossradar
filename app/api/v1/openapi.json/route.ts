import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";

/**
 * OpenAPI 3.1 description of the free public JSON API, so agent frameworks, custom GPT actions and
 * API directories can discover and call /api/v1/trending and /api/v1/repo/{owner}/{name} without
 * reverse-engineering the responses. Static (regenerated each deploy, i.e. hourly).
 * GET /api/v1/openapi.json
 */
const num = { type: "integer" } as const;
const str = { type: "string" } as const;
const nstr = { type: ["string", "null"] } as const;
const strArr = { type: "array", items: str } as const;

const baseRepo = {
  fullName: { ...str, description: "owner/name on GitHub" },
  url: { ...str, format: "uri", description: "GitHub repository URL" },
  ossradarUrl: { ...str, format: "uri", description: "This repo's page on OSS Radar (cite this)" },
  description: nstr,
  language: nstr,
  category: str,
  topics: strArr,
  stars: num,
  forks: num,
  starsGained24h: { ...num, description: "Stars gained in the last 24 hours" },
  starsGained7d: { ...num, description: "Stars gained in the last 7 days" },
  estimated: { type: "boolean", description: "True when gains are an early estimate (repo first seen less than a week ago)" },
  createdAt: { ...str, format: "date-time" },
  pushedAt: { ...str, format: "date-time" },
};

const envelope = {
  source: { ...str, format: "uri" },
  license: str,
  generatedAt: { ...str, format: "date-time", description: "When the underlying snapshot was taken; include it when citing numbers" },
};

export function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: `${SITE.name} API`,
      version: "1.0.0",
      summary: "Fastest-rising open-source AI and developer-tool repos on GitHub, ranked by star velocity.",
      description: `Free, read-only JSON from ${SITE.url}. No key, CORS open, updated hourly. Please link back to ${SITE.url} when you use the data. Data as of ${getData().generatedAt}.`,
      contact: { name: SITE.name, url: `${SITE.url}/about`, email: "hello@ossradar.net" },
      license: { name: "Free to use with a link back to ossradar.net", url: `${SITE.url}/about#api` },
    },
    externalDocs: { description: "llms.txt: key pages, URL patterns and current rankings", url: `${SITE.url}/llms.txt` },
    servers: [{ url: SITE.url }],
    paths: {
      "/api/v1/trending": {
        get: {
          operationId: "getTrendingRepos",
          summary: "Top 100 tracked repos by stars gained in the last 24 hours",
          description: "Current leaderboard with 24-hour and 7-day star gains, total stars, forks, language, category and topics.",
          responses: {
            "200": {
              description: "Leaderboard",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["generatedAt", "count", "repos"],
                    properties: {
                      ...envelope,
                      rankedBy: str,
                      count: num,
                      repos: {
                        type: "array",
                        items: { type: "object", properties: { rank: num, ...baseRepo } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/repo/{owner}/{name}": {
        get: {
          operationId: "getRepo",
          summary: "Star velocity, ranks and history for one tracked repo",
          description: "Tracked repos only (see /api/v1/trending or llms-full.txt for the list). Untracked repos return 404.",
          parameters: [
            { name: "owner", in: "path", required: true, schema: str, example: "morluto" },
            { name: "name", in: "path", required: true, schema: str, example: "rea" },
          ],
          responses: {
            "200": {
              description: "Repo data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ...envelope,
                      repo: {
                        type: "object",
                        properties: {
                          ...baseRepo,
                          summary: { ...nstr, description: "One-line plain-English summary" },
                          homepage: nstr,
                          license: { ...nstr, description: "SPDX id" },
                          categoryUrl: { ...str, format: "uri" },
                          rankToday: { ...num, description: "Rank by 24h star gain among tracked repos" },
                          rankThisWeek: { ...num, description: "Rank by 7-day star gain among tracked repos" },
                          trackedRepos: num,
                          starHistory: { type: "array", description: "Daily star snapshots", items: { type: "object" } },
                          hackerNews: { type: ["object", "null"], description: "Hacker News story count and top story, if any" },
                          alternativesUrl: { ...nstr, format: "uri" },
                          alternatives: strArr,
                          badgeUrl: { ...str, format: "uri", description: "SVG README badge" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "404": {
              description: "Not a tracked repo",
              content: { "application/json": { schema: { type: "object", properties: { error: str } } } },
            },
          },
        },
      },
    },
  };
  return Response.json(spec, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=600, s-maxage=600" },
  });
}
