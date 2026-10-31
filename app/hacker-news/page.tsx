import type { Metadata } from "next";
import { abs, breadcrumbLd, collectionPageLd, linkListLd, ogDefaults, repoPath, pageAlternates } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { PageNav } from "@/components/PageNav";
import Link from "next/link";
import { getData, getRepos } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { getRecentHn } from "@/lib/mentions";
import { repoBlurb, stripWhy } from "@/lib/blurb";
import { altLabel } from "@/lib/alternatives";

const DAYS = 30;

const TITLE = "GitHub repos trending on Hacker News this month";
const hnDescription = (n: number) =>
  `The ${n} open-source AI and developer-tool repos that hit Hacker News in the last ${DAYS} days, with points, comments and GitHub star growth. Updated hourly.`;

// Tracked repos with a top HN story, ranked by points (same rows the page renders).
function hnItems() {
  const list = getRecentHn(DAYS, Date.parse(getData().generatedAt));
  const byName = new Map(getRepos().map((r) => [r.fullName, r]));
  return list.flatMap(({ fullName, m }) => {
    const r = byName.get(fullName);
    return r && m.top ? [{ fullName, r, top: m.top }] : [];
  });
}

// Like topic, category, trending and /new hubs, the snippet names who leads right now: the top HN story's
// project by brand spelling (altLabel) with its points. Falls back to the fixed description when it won't fit.
function hnSnippet(n: number): string {
  const lead = hnItems()[0];
  if (!lead) return hnDescription(n);
  const head = `The ${n} open-source AI and dev-tool repos that hit Hacker News in the last ${DAYS} days, with points, comments and star growth.`;
  const top = ` Top story: ${altLabel(lead.r)} (${formatNumber(lead.top.points)} points).`;
  for (const v of [`${head}${top} Updated hourly.`, `${head}${top}`]) if (v.length <= 158) return v;
  return hnDescription(n);
}

export function generateMetadata(): Metadata {
  const n = getRecentHn(DAYS, Date.parse(getData().generatedAt)).length;
  // Keep <title> under ~60 chars rendered (with " · OSS Radar") so Google shows it whole;
  // the live count goes in the description and the longer social title.
  const title = TITLE;
  const socialTitle = `GitHub repos trending on Hacker News: ${n} open-source projects this month`;
  const description = hnSnippet(n);
  return { title, description, alternates: pageAlternates("/hacker-news"), openGraph: { siteName: ogDefaults.siteName, locale: ogDefaults.locale, type: ogDefaults.type, title: socialTitle, description, url: "/hacker-news" }, twitter: { card: "summary_large_image", title: socialTitle, description } };
}

export default function HackerNewsPage() {
  const data = getData();
  const list = getRecentHn(DAYS, Date.parse(data.generatedAt));
  const byName = new Map(getRepos().map((r) => [r.fullName, r]));
  // Only rows we can render (tracked repo + a top story), so numbering has no gaps.
  const items = list.flatMap(({ fullName, m }) => {
    const r = byName.get(fullName);
    return r && m.top ? [{ fullName, r, top: m.top }] : [];
  });
  // Answer-first, data-backed summary for search snippets and AI assistants.
  const lead = items[0];
  const showHn = items.filter(({ top }) => /^show hn/i.test(top.title)).length;
  const mostDiscussed = [...items].sort((a, b) => b.top.comments - a.top.comments)[0];
  const rows = items.map(({ fullName, r }) => ({ name: fullName, url: abs(repoPath(r)) }));
  return (
    <div className="max-w-3xl">
      <JsonLd data={collectionPageLd({ name: TITLE, description: hnSnippet(list.length), path: "/hacker-news", dateModified: data.generatedAt, ogCard: true, mainEntity: linkListLd(TITLE, rows) })} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Hacker News", path: "/hacker-news" }])} />
      <PageNav crumbs={[{ name: "Hacker News" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Hacker News</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">GitHub repos trending on Hacker News</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Tracked open-source repos that were posted to Hacker News (a popular tech discussion site) in the last {DAYS} days, ranked by the
        story&apos;s points (upvotes). &quot;Show HN&quot; posts are makers presenting their own project.
      </p>
      {lead && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          The top story right now is <Link className="underline" href={`/repo/${lead.r.owner}/${lead.r.name}`}>{altLabel(lead.r)}</Link> with{" "}
          {formatNumber(lead.top.points)} points and {formatNumber(lead.top.comments)} comments ({formatDate(lead.top.date)}).
          {mostDiscussed && mostDiscussed.fullName !== lead.fullName && (
            <> The most discussed is <Link className="underline" href={`/repo/${mostDiscussed.r.owner}/${mostDiscussed.r.name}`}>{altLabel(mostDiscussed.r)}</Link> ({formatNumber(mostDiscussed.top.comments)} comments).</>
          )}{" "}
          {showHn} of the {items.length} stories are Show HN posts.
        </p>
      )}
      <p className="mt-3 text-xs text-zinc-500">{items.length} repos · HN data from the public HN Algolia API · refreshed every 12 hours</p>
      <h2 id="stories" className="mb-3 mt-6 scroll-mt-6 text-xl font-semibold tracking-tight">Hacker News stories, ranked by points</h2>
      <ol className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {items.map(({ fullName, r, top }, i) => {
          const blurb = repoBlurb(r) ?? stripWhy(r.oneLiner);
          return (
            <li key={fullName} className="flex gap-4 p-4">
              <span className="w-6 shrink-0 text-right tabular-nums text-zinc-500">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <a href={`https://news.ycombinator.com/item?id=${top.id}`} rel="noopener" className="font-medium hover:underline">{top.title}</a>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {formatNumber(top.points)} points · {formatNumber(top.comments)} comments · {formatDate(top.date)}
                </p>
                <p className="mt-1 text-sm">
                  <Link href={`/repo/${r.owner}/${r.name}`} className="text-indigo-700 underline underline-offset-2 dark:text-indigo-400">{fullName}</Link>
                  <span className="text-zinc-500"> · {formatNumber(r.stars)} stars · +{formatNumber(r.delta7d)}{r.estimated7d ? "*" : ""} this week</span>
                </p>
                {blurb && <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{blurb}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {items.some(({ r }) => r.estimated7d) && <p className="mt-2 text-xs text-zinc-500">* Estimated weekly gain (not enough daily snapshots yet).</p>}
    </div>
  );
}
