import { categoryLabel } from "@/lib/categories";
import { getData, rankRepos } from "@/lib/data";
import { formatDelta } from "@/lib/format";
import { SITE } from "@/lib/site";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // strip characters that are invalid in XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

export function GET() {
  const data = getData();
  const pubDate = new Date(data.generatedAt).toUTCString();
  const items = rankRepos(data.repos, "today")
    .slice(0, 50)
    .map((r) => {
      const link = `${SITE.url}/repo/${r.owner}/${r.name}`;
      const est = r.estimated24h ? " (est.)" : "";
      return `    <item>
      <title>${esc(`${r.fullName}: ${formatDelta(r.delta24h)} stars/24h${est}`)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="false">${esc(`${r.fullName}@${data.snapshotDate}`)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${esc(categoryLabel(r.category))}</category>
      <description>${esc(r.oneLiner)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)}: fastest-rising repos today</title>
    <link>${SITE.url}</link>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(SITE.tagline)}</description>
    <language>en</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
