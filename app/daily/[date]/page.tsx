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

export async function generateMetadata({ params }: PageProps<"/daily/[date]">): Promise<Metadata> {
  const { date } = await params;
  if (!getArchiveDays().includes(date)) return {};
  const title = `Fastest-rising GitHub repos on ${formatDate(date)}`;
  const description = `The open-source AI and developer-tool repos that gained the most GitHub stars on ${formatDate(date)}, from ${SITE.name}.`;
  return { title, description, alternates: { canonical: `/daily/${date}` }, openGraph: { title, description, url: `/daily/${date}` } };
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
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <BackButton fallbackHref="/daily" />
        <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-zinc-500">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/daily" className="hover:underline">Daily archive</Link> / <span className="text-zinc-700 dark:text-zinc-300">{date}</span>
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
              {e.repo?.description && <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{e.repo.description}</p>}
            </div>
            <div className="shrink-0 text-right">
              <div className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">+{formatNumber(e.gained)}</div>
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
