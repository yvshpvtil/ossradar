import { altLabel } from "@/lib/alternatives";
import { getArchiveDays, getDailyTop } from "@/lib/daily";
import { formatDate, formatNumber } from "@/lib/format";
import { esc } from "@/lib/rss";
import { repoPath } from "@/lib/seo";
import { SITE } from "@/lib/site";

const MAX_DAYS = 30;

/**
 * Daily digest feed: one item per completed UTC day (the /daily/{date} archive page) with that day's
 * top 10, newest first. Unlike /rss.xml, whose items change every hour, an item here never changes once
 * published, so readers get one quiet entry a day. Advertised by <link rel=alternate> on /daily pages.
 */
export function GET() {
  const days = getArchiveDays().slice(0, MAX_DAYS);
  // A day is complete once the next UTC day's snapshot exists, so it is published at the following midnight UTC.
  const published = (d: string) => new Date(Date.parse(d + "T00:00:00Z") + 86_400_000).toUTCString();
  const items = days
    .map((date) => {
      const top = getDailyTop(date, 10);
      if (top.length === 0) return "";
      const link = `${SITE.url}/daily/${date}`;
      const lead = top[0];
      const leadName = lead.repo ? altLabel(lead.repo) : lead.fullName;
      const list = top
        .map((e) => {
          const name = esc(e.repo ? altLabel(e.repo) : e.fullName);
          const href = e.repo ? `${SITE.url}${repoPath(e.repo)}` : `https://github.com/${e.fullName}`;
          return `<li><a href="${esc(href)}">${name}</a>: +${formatNumber(e.gained)} stars</li>`;
        })
        .join("");
      const html = `<p>The ${top.length} open-source repos that gained the most GitHub stars on ${formatDate(date)}, measured from ${SITE.name}'s daily snapshots.</p><ol>${list}</ol><p><a href="${link}">Full list for ${formatDate(date)}</a></p>`;
      return `    <item>
      <title>${esc(`Top GitHub risers on ${formatDate(date)}: ${leadName} leads with +${formatNumber(lead.gained)} stars`)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${published(date)}</pubDate>
      <description>${esc(html)}</description>
    </item>`;
    })
    .filter(Boolean)
    .join("\n");
  const last = days[0] ? published(days[0]) : new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${SITE.name}: daily top 10 rising GitHub repos`)}</title>
    <link>${SITE.url}/daily</link>
    <atom:link href="${SITE.url}/daily/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(`One entry per day: the 10 open-source AI and developer-tool repos that gained the most GitHub stars that UTC day, from ${SITE.name}'s daily archive.`)}</description>
    <language>en</language>
    <ttl>360</ttl>
    <lastBuildDate>${last}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
