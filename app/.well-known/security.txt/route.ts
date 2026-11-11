import { SITE } from "@/lib/site";

// RFC 9116 security.txt: where to report a vulnerability. Expires is required and must be under a
// year out, so it is computed per request (a rolling 180 days) and never goes stale.
export function GET() {
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  expires.setUTCHours(0, 0, 0, 0);
  const body = [
    `Contact: mailto:${SITE.sponsorEmail}`,
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en",
    `Canonical: ${SITE.url}/.well-known/security.txt`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
