import { repoBlurb } from "@/lib/blurb";
import { abs, breadcrumbLd, linkListLd, ogCardLd, ogDefaults, repoPath, withoutContext, websiteRef } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/BackNav";
import { notFound } from "next/navigation";
import { getArchiveDays, getDailyTop } from "@/lib/daily";
import { formatDate, formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  const days = getArchiveDays();
  return days.length ? days.map((date) => ({ date })) : [{ date: "none" }];
}

// Unique per day: name that day's top gainers (as many as fit ~158 chars) so each archive page's snippet says what's on it.
function dailyDescription(date: string) {
  const day = formatDate(date);
  const head = `Top rising GitHub repos on ${day}: `;
  const tail = `. See the day's full open-source AI & dev-tool list.`;
  const fallback = `The open-source AI and developer-tool repos that gained the most GitHub stars on ${day}, from ${SITE.name}.`;
  const items = getDailyTop(date).slice(0, 3).map((e, i) => `${e.fullName.split("/")[1]} (+${formatNumber(e.gained)}${i ? "" : " stars"})`);
  for (let n = items.length; n > 0; n--) {
    const list = n === 1 ? items[0] : `${items.slice(0, n - 1).join(", ")} and ${items[n - 1]}`;
    const d = `${head}${list}${tail}`;
    if (d.length <= 158) return d;
  }
  return fallback;
}

export async function generateMetadata({ params }: PageProps<"/daily/[date]">): Promise<Metadata> {
  const { date } = await params;
  if (!getArchiveDays().includes(date)) return {};
  const title = `Fastest-rising GitHub repos on ${formatDate(date)}`;
  const description = dailyDescription(date);
  return { title, description, alternates: { canonical: `/daily/${date}` }, openGraph: { siteName: ogDefaults.siteName, locale: ogDefaults.locale, type: ogDefaults.type, title, description, url: `/daily/${date}` }, twitter: { card: "summary_large_image", title, description } };
}

export default async function DailyPage({ params }: PageProps<"/daily/[date]">) {
  const { date } = await params;
  const days = getArchiveDays();
  const i = days.indexOf(date);
  if (i < 0) notFound();
  const top = getDailyTop(date);
  const newer = days[i - 1], older = days[i + 1];
  return (
    <div className="max-w-3xl">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Fastest-rising GitHub repos on ${formatDate(date)}`,
          description: dailyDescription(date),
          url: abs(`/daily/${date}`),
          datePublished: date,
          temporalCoverage: date,
          inLanguage: "en",
          isPartOf: websiteRef,
          primaryImageOfPage: ogCardLd(`/daily/${date}`),
          mainEntity: withoutContext(linkListLd(`Fastest-rising GitHub repos on ${formatDate(date)}`, top.map((e) => ({ name: e.fullName, url: e.repo ? abs(repoPath(e.repo)) : `https://github.com/${e.fullName}` })))),
        }}
      />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Daily archive", path: "/daily" }, { name: formatDate(date), path: `/daily/${date}` }])} />
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <BackButton fallbackHref="/daily" />
        <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-zinc-500">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/daily" className="hover:underline">Daily archive</Link> / <span className="text-zinc-700 dark:text-zinc-300">{formatDate(date)}</span>
        </nav>
      </div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Top rising repos on {formatDate(date)}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Stars gained during this UTC day, measured from our daily snapshots.</p>
      <ol className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {top.map((e, n) => (
          <li key={e.fullName} className="relative cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 flex items-start gap-4 p-4">
            <span className="w-6 shrink-0 text-right tabular-nums text-zinc-500">{n + 1}</span>
            <div className="min-w-0 flex-1">
              {e.repo ? (
                <Link className={`font-medium hover:underline after:absolute after:inset-0 after:content-['']`} href={`/repo/${e.repo.owner}/${e.repo.name}`}>{e.fullName}</Link>
              ) : (
                <a className={`font-medium hover:underline after:absolute after:inset-0 after:content-['']`} href={`https://github.com/${e.fullName}`}>{e.fullName}</a>
              )}
              {e.repo && repoBlurb(e.repo) && <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{repoBlurb(e.repo)}</p>}
            </div>
            <div className="shrink-0 text-right">
              <div className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">+{formatNumber(e.gained)}</div>
              <div className="text-xs text-zinc-500">{formatNumber(e.stars)} total</div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex justify-between text-sm">
        {older ? <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href={`/daily/${older}`}>← {formatDate(older)}</Link> : <span />}
        {newer ? <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href={`/daily/${newer}`}>{formatDate(newer)} →</Link> : <span />}
      </div>
    </div>
  );
}
