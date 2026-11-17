import { getData, rankRepos } from "@/lib/data";
import { SITE } from "@/lib/site";

/**
 * RFC 9727 API catalog: the well-known entry point API crawlers and agent frameworks probe to find
 * a site's APIs. A Linkset (RFC 9264) listing the free JSON endpoints with their OpenAPI 3.1
 * description (service-desc), human docs (service-doc) and the agent briefing (describedby).
 * GET/HEAD /.well-known/api-catalog
 */
const TYPE = 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';

function linkset() {
  const api = `${SITE.url}/api/v1`;
  const example = rankRepos(getData().repos, "today")[0]?.fullName ?? "libracoder/kiri";
  return {
    linkset: [
      // The catalog itself: one API (/api/v1, two JSON endpoints).
      { anchor: `${SITE.url}/.well-known/api-catalog`, item: [{ href: api, title: `${SITE.name} JSON API v1 (free, no key)` }] },
      {
        anchor: api,
        "service-desc": [{ href: `${api}/openapi.json`, type: "application/openapi+json" }],
        "service-doc": [{ href: `${SITE.url}/about#api`, type: "text/html" }],
        describedby: [
          { href: `${SITE.url}/agents.md`, type: "text/markdown" },
          { href: `${SITE.url}/llms.txt`, type: "text/plain" },
        ],
        // Endpoints (the per-repo one is /api/v1/repo/{owner}/{name}; example shown).
        item: [
          { href: `${api}/trending`, type: "application/json", title: "Top 100 tracked repos by 24h GitHub star gain" },
          { href: `${api}/repo/${example}`, type: "application/json", title: "One tracked repo (/api/v1/repo/{owner}/{name})" },
        ],
      },
    ],
  };
}

const headers = {
  "Content-Type": TYPE,
  "Cache-Control": "public, max-age=86400",
  "Access-Control-Allow-Origin": "*",
  Link: `<${SITE.url}/.well-known/api-catalog>; rel="api-catalog"`,
  "X-Robots-Tag": "noindex",
};

export function GET() {
  return new Response(JSON.stringify(linkset(), null, 2) + "\n", { headers });
}

export function HEAD() {
  return new Response(null, { headers });
}
