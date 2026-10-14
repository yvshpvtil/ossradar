import { getRepo } from "@/lib/data";
import { badgeSpec } from "@/lib/badge";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
function badge({ label, message, color, lw, mw, width: w }: ReturnType<typeof badgeSpec>): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(label)}: ${esc(message)}">
<title>${esc(label)}: ${esc(message)}</title>
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#4f46e5"/><rect x="${lw}" width="${mw}" height="20" fill="${color}"/><rect width="${w}" height="20" fill="url(#s)"/></g>
<g transform="translate(5 4) scale(.375)"><circle cx="16" cy="16" r="10" fill="none" stroke="#fff" stroke-width="3"/><path d="M16 16 L16 3 A13 13 0 0 1 28.5 12.5 Z" fill="#fff" fill-opacity=".5"/><circle cx="16" cy="16" r="4" fill="#fff"/></g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<text x="${16 + (lw - 16) / 2}" y="14">${esc(label)}</text>
<text x="${lw + mw / 2}" y="14">${esc(message)}</text></g></svg>`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
  const repo = getRepo(owner, name.replace(/\.svg$/, ""));
  const svg = badge(badgeSpec(repo));
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
