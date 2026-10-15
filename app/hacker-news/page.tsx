import type { Metadata } from "next";
import { ogDefaults, twitterImage } from "@/lib/seo";
import { PageNav } from "@/components/PageNav";
import Link from "next/link";
import { getData, getRepos } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { getRecentHn } from "@/lib/mentions";

const DAYS = 30;

export function generateMetadata(): Metadata {
  const n = getRecentHn(DAYS, Date.parse(getData().generatedAt)).length;
  // Keep <title> under ~60 chars rendered (with " · OSS Radar") so Google shows it whole;
  // the live count goes in the description and the longer social title.
  const title = "GitHub repos trending on Hacker News this month";
  const socialTitle = `GitHub repos trending on Hacker News: ${n} open-source projects this month`;
  const description = `The ${n} open-source AI and developer-tool repos that hit Hacker News in the last ${DAYS} days, with points, comments and GitHub star growth. Updated hourly.`;
  return { title, description, alternates: { canonical: "/hacker-news" }, openGraph: { ...ogDefaults, title: socialTitle, description, url: "/hacker-news" }, twitter: { card: "summary_large_image", title: socialTitle, description, ...twitterImage } };
}

export default function HackerNewsPage() {
  const list = getRecentHn(DAYS, Date.parse(getData().generatedAt));
  const byName = new Map(getRepos().map((r) => [r.fullName, r]));
  return (
    <div className="max-w-3xl">
      <PageNav crumbs={[{ name: "Hacker News" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Hacker News</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Repos trending on Hacker News</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Tracked open-source repos that were posted to Hacker News (a popular tech discussion site) in the last {DAYS} days, ranked by the
        story&apos;s points (upvotes). &quot;Show HN&quot; posts are makers presenting their own project.
      </p>
      <p className="mt-3 text-xs text-zinc-500">{list.length} repos · HN data from the public HN Algolia API · refreshed every 12 hours</p>
      <ol className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {list.map(({ fullName, m }, i) => {
          const r = byName.get(fullName);
          if (!r || !m.top) return null;
          return (
            <li key={fullName} className="flex gap-4 p-4">
              <span className="w-6 shrink-0 text-right tabular-nums text-zinc-500">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <a href={`https://news.ycombinator.com/item?id=${m.top.id}`} rel="noopener" className="font-medium hover:underline">{m.top.title}</a>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {formatNumber(m.top.points)} points · {formatNumber(m.top.comments)} comments · {formatDate(m.top.date)}
                </p>
                <p className="mt-1 text-sm">
                  <Link href={`/repo/${r.owner}/${r.name}`} className="text-indigo-700 underline underline-offset-2 dark:text-indigo-400">{fullName}</Link>
                  <span className="text-zinc-500"> · {formatNumber(r.stars)} stars · +{formatNumber(r.delta7d)}{r.estimated7d ? "*" : ""} this week</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {list.some(({ fullName }) => byName.get(fullName)?.estimated7d) && <p className="mt-2 text-xs text-zinc-500">* Estimated weekly gain (not enough daily snapshots yet).</p>}
    </div>
  );
}
