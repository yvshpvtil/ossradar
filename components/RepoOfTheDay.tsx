import Image from "next/image";
import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { formatDelta, formatNumber } from "@/lib/format";
import type { Repo } from "@/lib/types";
import { stripWhy } from "@/lib/why";
import { WatchButton } from "./WatchButton";

/** Pick the top 24h gainer, preferring measured (non-estimated) numbers when any exist. */
export function pickRepoOfTheDay(repos: Repo[]): Repo | undefined {
  const measured = repos.filter((r) => !r.estimated24h);
  const pool = measured.length >= 10 ? measured : repos;
  return [...pool].sort((a, b) => b.delta24h - a.delta24h || b.stars - a.stars)[0];
}

function whyRising(r: Repo, now: number): string {
  const ageDays = Math.max(1, Math.round((now - Date.parse(r.createdAt)) / 86_400_000));
  const avg = r.stars / ageDays;
  if (!r.estimated24h) {
    const x = avg > 0 ? r.delta24h / avg : 0;
    const pace = x >= 1.5 ? `, ${x.toFixed(1)}× its average daily pace since launch` : "";
    return `${formatDelta(r.delta24h)} stars in the last 24 hours${pace}. The top gainer in ${categoryLabel(r.category)} today.`;
  }
  return `Launched ${ageDays} day${ageDays === 1 ? "" : "s"} ago and already at ${formatNumber(r.stars)} stars, roughly ${formatNumber(Math.round(avg))} a day (estimated until more snapshots accumulate).`;
}

export function RepoOfTheDay({ repo, now }: { repo: Repo; now: number }) {
  return (
    <section aria-label="Repo of the day" className="relative mb-8 cursor-pointer rounded-xl border border-indigo-200 transition-colors hover:border-indigo-400 bg-indigo-50/60 p-4 sm:p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Repo of the day</p>
      <div className="flex items-start gap-3">
        <Image
          src={`${repo.ownerAvatar}${repo.ownerAvatar.includes("?") ? "&" : "?"}s=80`}
          alt={`${repo.owner} avatar`}
          width={40}
          height={40}
          unoptimized
          className="shrink-0 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <Link href={`/repo/${repo.owner}/${repo.name}`} className="break-words text-base font-semibold [overflow-wrap:anywhere] hover:underline sm:text-lg after:absolute after:inset-0 after:content-['']">
            <span className="text-zinc-500 dark:text-zinc-400">{repo.owner}/</span>
            {repo.name}
          </Link>
          {stripWhy(repo.oneLiner) && <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{stripWhy(repo.oneLiner)}</p>}
          <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">Why it&apos;s rising: {whyRising(repo, now)}</p>
        </div>
        <span className="relative z-10"><WatchButton fullName={repo.fullName} /></span>
      </div>
    </section>
  );
}
