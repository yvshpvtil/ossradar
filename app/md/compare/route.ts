import { markdownResponse } from "@/lib/agents";
import { compareMarkdown } from "@/lib/compareMd";

/**
 * Served at /compare.md?r=a,b,c (next.config.ts rewrite) and at /compare?r=... for
 * Accept: text/markdown (proxy.ts). Rendered per request because it depends on ?r=; the data is
 * bundled at build time (rebuilt hourly). Canonical points at the HTML comparison, noindexed.
 */
export async function GET(req: Request) {
  const { body, status, canonical } = compareMarkdown(new URL(req.url).searchParams.get("r"));
  const res = markdownResponse(body, canonical);
  const out = new Response(res.body, { status, headers: res.headers });
  out.headers.set("X-Robots-Tag", "noindex, follow");
  out.headers.set("Access-Control-Allow-Origin", "*");
  out.headers.set("Vary", "Accept");
  return out;
}
