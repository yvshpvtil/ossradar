import type { Metadata } from "next";
import { abs, breadcrumbLd, linkListLd, ogDefaults, repoPath, twitterImage, withoutContext, websiteRef } from "@/lib/seo";
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
const description = `Which open-source AI and developer-tool repos gained the most GitHub stars each day: ${SITE.name}'s dated archive with each day's top risers, newest first.`;

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
  const summary = archiveSummary(days);
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Daily archive", path: "/daily" }])} />
      {days.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url: abs("/daily"),
            dateModified: days[0],
            temporalCoverage: `${days[days.length - 1]}/${days[0]}`,
            inLanguage: "en",
            isPartOf: websiteRef,
            mainEntity: withoutContext(linkListLd("OSS Radar daily archive", days.map((d) => ({ name: `Fastest-rising GitHub repos on ${formatDate(d)}`, url: abs(`/daily/${d}`) })))),
          }}
        />
      )}
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
      {summary && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight">Across the archive</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Over the {summary.days} archived days, {summary.distinct} different repos made a daily top 10.{" "}
            {summary.leader.days === summary.days
              ? <>The same repo finished first every day: <Link className="font-medium hover:underline" href={summary.leader.href}>{summary.leader.fullName}</Link>.</>
              : <>The most frequent daily #1 was <Link className="font-medium hover:underline" href={summary.leader.href}>{summary.leader.fullName}</Link>, first on {summary.leader.days} of {summary.days} days.</>}{" "}
            The biggest single day was {summary.best.fullName} with +{formatNumber(summary.best.gained)} stars on {formatDate(summary.best.date)}, and on an average day the #1 repo took {summary.leaderShare}% of all stars gained by that day&apos;s top 10.
          </p>
          {summary.regulars.length > 0 && (
            <>
              <h3 className="mt-4 text-sm font-semibold">Most days in the top 10</h3>
              <ol className="mt-2 space-y-1 text-sm">
                {summary.regulars.map((r, i) => (
                  <li key={r.fullName}>
                    {i + 1}. <Link className="font-medium hover:underline" href={r.href}>{r.fullName}</Link>{" "}
                    <span className="text-zinc-500">{r.days} of {summary.days} days, +{formatNumber(r.gained)} stars in total</span>
                  </li>
                ))}
              </ol>
            </>
          )}
          <h3 className="mt-4 text-sm font-semibold">How a day is measured</h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Once per UTC day we save the star count of every tracked repo. A day&apos;s gain is that day&apos;s count minus the previous day&apos;s, so a repo only appears once it has been tracked for two days in a row, and a day is archived only when both snapshots exist. Stars lost to unstarring are netted out, and repos with no net gain are left off. The archive grows by one page each day.
          </p>
        </section>
      )}
      <div className="mt-10 max-w-xl">
        <p className="mb-2 text-sm font-medium">Get each day&apos;s top 10 by email</p>
        <NewsletterForm />
      </div>
    </div>
  );
}

type Tally = { fullName: string; href: string; days: number; gained: number };

/** Data-built summary of every archived day's top 10, so the index explains the archive, not just lists it. */
function archiveSummary(days: string[]) {
  if (days.length < 2) return null;
  const inTop = new Map<string, Tally>();
  const firsts = new Map<string, Tally>();
  let best: { fullName: string; gained: number; date: string } | null = null;
  let shareSum = 0, shareDays = 0;
  for (const date of days) {
    const top = getDailyTop(date, 10);
    if (top.length === 0) continue;
    const total = top.reduce((a, e) => a + e.gained, 0);
    if (total > 0) { shareSum += top[0].gained / total; shareDays++; }
    top.forEach((e, i) => {
      const href = e.repo ? repoPath(e.repo) : `/daily/${date}`;
      const t = inTop.get(e.fullName) ?? { fullName: e.fullName, href, days: 0, gained: 0 };
      t.days++; t.gained += e.gained; inTop.set(e.fullName, t);
      if (i === 0) {
        const f = firsts.get(e.fullName) ?? { fullName: e.fullName, href, days: 0, gained: 0 };
        f.days++; f.gained += e.gained; firsts.set(e.fullName, f);
      }
      if (!best || e.gained > best.gained) best = { fullName: e.fullName, gained: e.gained, date };
    });
  }
  if (!best || shareDays === 0) return null;
  const byDays = (a: Tally, b: Tally) => b.days - a.days || b.gained - a.gained;
  const leader = [...firsts.values()].sort(byDays)[0];
  const regulars = [...inTop.values()].filter((t) => t.days >= 2).sort(byDays).slice(0, 5);
  return { days: days.length, distinct: inTop.size, leader, best: best as { fullName: string; gained: number; date: string }, leaderShare: Math.round((shareSum / shareDays) * 100), regulars };
}
