import type { Metadata } from "next";
import { abs, breadcrumbLd, linkListLd, ogDefaults, repoPath, twitterImage } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { PageNav } from "@/components/PageNav";
import Link from "next/link";
import { getData, rankRepos } from "@/lib/data";
import { getArchiveDays, getDailyTop } from "@/lib/daily";
import { formatDate, formatNumber } from "@/lib/format";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SITE } from "@/lib/site";

// Keep <title> under ~60 chars rendered (with " · OSS Radar") so Google shows it whole;
// the longer phrase stays on OG/X like /hacker-news.
const title = "Daily archive of rising GitHub repos";
const socialTitle = "Daily archive: the fastest-rising GitHub repos, day by day";
const description = `Which open-source AI and developer-tool repos gained the most GitHub stars each day, archived by ${SITE.name}.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/daily" },
  openGraph: { ...ogDefaults, title: socialTitle, description, url: "/daily" },
  twitter: { card: "summary_large_image", title: socialTitle, description, ...twitterImage },
};

export default function DailyIndex() {
  const days = getArchiveDays();
  const live = rankRepos(getData().repos, "today").slice(0, 5);
  // Each archived day with its top 3, so the index says what happened that day (and links those repo pages), not just a list of dates.
  const past = days.map((d) => ({ date: d, top: getDailyTop(d, 3) }));
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Daily archive", path: "/daily" }])} />
      {days.length > 0 && <JsonLd data={linkListLd("OSS Radar daily archive", days.map((d) => ({ name: `Fastest-rising GitHub repos on ${formatDate(d)}`, url: abs(`/daily/${d}`) })))} />}
      <PageNav crumbs={[{ name: "Daily archive" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Archive</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Daily archive</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        The repos that gained the most GitHub stars on each day, measured from our daily snapshots (a saved star count for every tracked repo, once per UTC day).
      </p>
      <section className="mt-6 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Today so far (live)</h2>
        <ol className="mt-2 space-y-1 text-sm">
          {live.map((r, i) => (
            <li key={r.fullName}>
              {i + 1}. <Link className="font-medium hover:underline" href={`/repo/${r.owner}/${r.name}`}>{r.fullName}</Link>{" "}
              <span className="text-emerald-700 dark:text-emerald-400">+{formatNumber(r.delta24h)}</span>
            </li>
          ))}
        </ol>
        <Link href="/" className="mt-3 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400">Full live leaderboard →</Link>
      </section>
      <h2 className="mt-8 text-xl font-semibold tracking-tight">Past days</h2>
      {days.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">The first full day is archived once we have two consecutive daily snapshots. Check back tomorrow.</p>
      ) : (
        <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
          {past.map(({ date, top }) => (
            <li key={date} className="py-3">
              <Link className="font-medium hover:underline" href={`/daily/${date}`}>Top repos on {formatDate(date)}</Link>
              {top.length > 0 && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {top.map((e, i) => (
                    <span key={e.fullName}>
                      {i > 0 && ", "}
                      {i + 1}.{" "}
                      {e.repo ? (
                        <Link className="hover:underline" href={repoPath(e.repo)}>{e.fullName}</Link>
                      ) : (
                        e.fullName
                      )}{" "}
                      <span className="text-emerald-700 dark:text-emerald-400">+{formatNumber(e.gained)}</span>
                    </span>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-10 max-w-xl">
        <p className="mb-2 text-sm font-medium">Get each day&apos;s top 10 by email</p>
        <NewsletterForm />
      </div>
    </div>
  );
}
