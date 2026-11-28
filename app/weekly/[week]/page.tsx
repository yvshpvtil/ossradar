import { repoBlurb } from "@/lib/blurb";
import { abs, breadcrumbLd, linkListLd, ogDefaults, repoPath, withoutContext, websiteRef, pageNodeIds, RSS_ALTERNATE, twitterDefaults } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/BackNav";
import { notFound } from "next/navigation";
import { getWeekTop, getWeekWindow, getWeekWindows, weekRange, weekSummary, type WeekWindow } from "@/lib/weekly";
import { monthLabel } from "@/lib/monthly";
import { altLabel, ldRepoName } from "@/lib/alternatives";
import { formatDate, formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";

// Weeks are built from the daily snapshots at build time (rebuilt hourly); unknown weeks 404 (notFound below; proxy.ts 404s them first).
export function generateStaticParams() {
  const w = getWeekWindows();
  return w.length ? w.map((x) => ({ week: x.week })) : [{ week: "none" }];
}

const titleFor = (w: WeekWindow) => `Top GitHub repos of the week: ${weekRange(w)}${w.complete ? "" : " (so far)"}`;

function weekDescription(w: WeekWindow) {
  const head = `The open-source AI & dev-tool repos that gained the most GitHub stars in the week of ${formatDate(w.monday)}: `;
  const items = getWeekTop(w.week, 3).map((e, i) => `${e.repo ? altLabel(e.repo) : e.fullName} (+${formatNumber(e.gained)}${i ? "" : " stars"})`);
  for (let n = items.length; n > 0; n--) {
    const d = `${head}${n === 1 ? items[0] : `${items.slice(0, n - 1).join(", ")} and ${items[n - 1]}`}.`;
    if (d.length <= 158) return d;
  }
  return `The open-source AI and developer-tool repos that gained the most GitHub stars from ${formatDate(w.from)} to ${formatDate(w.to)}, from ${SITE.name}.`;
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }): Promise<Metadata> {
  const { week } = await params;
  const w = getWeekWindow(week);
  if (!w) return {};
  const title = titleFor(w);
  const description = weekDescription(w);
  const path = `/weekly/${week}`;
  return { title, description, alternates: { canonical: path, types: { ...RSS_ALTERNATE, "text/markdown": [{ url: `${path}.md`, title: `${title} (Markdown)` }] } }, openGraph: { ...ogDefaults, title, description, url: path }, twitter: { ...twitterDefaults, title, description } };
}

const link = "text-indigo-600 hover:underline dark:text-indigo-400";

export default async function WeeklyPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const w = getWeekWindow(week);
  if (!w) notFound();
  const all = getWeekWindows().map((x) => x.week);
  const i = all.indexOf(week);
  const newer = getWeekWindow(all[i - 1] ?? ""), older = getWeekWindow(all[i + 1] ?? "");
  const top = getWeekTop(week);
  const s = weekSummary(week);
  const title = titleFor(w);
  const path = `/weekly/${week}`;
  const crumb = `Week of ${formatDate(w.monday)}`;
  const months = [...new Set(w.days.map((d) => d.slice(0, 7)))];
  return (
    <div className="max-w-3xl">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          ...pageNodeIds(path),
          name: title,
          description: weekDescription(w),
          url: abs(path),
          dateModified: w.to,
          temporalCoverage: `${w.from}/${w.to}`,
          inLanguage: "en",
          isPartOf: websiteRef,
          mainEntity: withoutContext(linkListLd(title, top.map((e) => ({ name: e.repo ? ldRepoName(e.repo) : e.fullName, url: e.repo ? abs(repoPath(e.repo)) : `https://github.com/${e.fullName}` })))),
        }}
      />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Weekly", path: "/weekly" }, { name: crumb, path }])} />
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <BackButton fallbackHref="/weekly" />
        <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-zinc-500">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/weekly" className="hover:underline">Weekly</Link> / <span className="text-zinc-700 dark:text-zinc-300">{crumb}</span>
        </nav>
      </div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Stars gained from {formatDate(w.from)} to {formatDate(w.to)} (UTC, ISO week {week}), measured from our daily snapshots{w.complete ? "." : ". This week isn't over yet, so the list updates every day."}
      </p>
      {top.length >= 3 && (
        <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
          <h2 className="sr-only">The week in numbers</h2>
          <p>
            The {top.length} repos below gained {formatNumber(s.total)} stars between them this week. {top[0].repo ? <Link className={`font-medium ${link}`} href={repoPath(top[0].repo)}>{altLabel(top[0].repo)}</Link> : <span className="font-medium">{top[0].fullName}</span>} led with +{formatNumber(top[0].gained)}.
            {s.created > 0 && <> {s.created} of them {s.created === 1 ? "was" : "were"} created on GitHub during the week.</>}
            {s.mostAtOne && <> {s.mostAtOne.repo ? altLabel(s.mostAtOne.repo) : s.mostAtOne.fullName} topped the <Link className={link} href="/daily">daily list</Link> most often ({s.mostAtOne.daysAtOne} of {w.days.length} days).</>}
          </p>
        </div>
      )}
      <h2 id="leaderboard" className="mb-3 mt-6 scroll-mt-6 text-xl font-semibold tracking-tight">Top {top.length} by stars gained this week</h2>
      <ol className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {top.map((e, n) => (
          <li key={e.fullName} className="relative cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 flex items-start gap-4 p-4">
            <span className="w-6 shrink-0 text-right tabular-nums text-zinc-500">{n + 1}</span>
            <div className="min-w-0 flex-1">
              {e.repo ? (
                <Link className="font-medium hover:underline after:absolute after:inset-0 after:content-['']" href={repoPath(e.repo)} title={e.fullName}>{altLabel(e.repo)}</Link>
              ) : (
                <a className="font-medium hover:underline after:absolute after:inset-0 after:content-['']" href={`https://github.com/${e.fullName}`}>{e.fullName}</a>
              )}
              {e.repo && altLabel(e.repo) !== e.fullName && <span className="ml-1.5 text-xs text-zinc-500">{e.fullName}</span>}
              {e.newThisMonth && <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">new</span>}
              {e.repo && repoBlurb(e.repo) && <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{repoBlurb(e.repo)}</p>}
              {e.daysInTop > 0 && <p className="mt-0.5 text-xs text-zinc-500">In the daily top 25 on {e.daysInTop} of {w.days.length} days{e.daysAtOne ? `, #1 on ${e.daysAtOne}` : ""}</p>}
            </div>
            <div className="shrink-0 text-right">
              <div className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">+{formatNumber(e.gained)}</div>
              <div className="text-xs text-zinc-500">{formatNumber(e.stars)} total</div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-zinc-500">
        Day by day: {w.days.map((d, n) => <span key={d}>{n ? ", " : ""}<Link className={link} href={`/daily/${d}`}>{formatDate(d).slice(0, -6)}</Link></span>)}. Whole month: {months.map((m, n) => <span key={m}>{n ? " and " : ""}<Link className={link} href={`/monthly/${m}`}>{monthLabel(m)}</Link></span>)}. Right now: <Link className={link} href="/">today&apos;s leaderboard</Link> and the rolling <Link className={link} href="/trending/ai-repos-this-week">last 7 days</Link>.
      </p>
      <div className="mt-6 flex justify-between text-sm">
        {older ? <Link className={link} href={`/weekly/${older.week}`}>← Week of {formatDate(older.monday)}</Link> : <span />}
        {newer ? <Link className={link} href={`/weekly/${newer.week}`}>Week of {formatDate(newer.monday)} →</Link> : <span />}
      </div>
    </div>
  );
}
