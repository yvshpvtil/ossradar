import { repoBlurb } from "@/lib/blurb";
import Link from "next/link";
import { formatDelta } from "@/lib/format";
import type { Repo } from "@/lib/types";
import { ShareButton } from "./ShareButton";

/** Compact "Trending today" cards: the top movers at a glance, above the full leaderboard. */
export function TrendingGrid({ repos }: { repos: Repo[] }) {
  if (repos.length === 0) return null;
  return (
    <section aria-labelledby="trending-today" className="mb-8">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="trending-today" className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Trending today
        </h2>
        <a href="#leaderboard" className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">Full leaderboard ↓</a>
      </div>
      <ol className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {repos.map((r, i) => (
          <li
            key={r.fullName}
            className="relative cursor-pointer flex w-[78%] shrink-0 snap-start flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-indigo-300 hover:shadow-sm sm:w-auto dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-indigo-700"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono tabular-nums text-zinc-400 dark:text-zinc-500">#{i + 1}</span>
              <span
                className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
                title={r.estimated24h ? "Estimated: not enough daily snapshots yet" : undefined}
              >
                ▲ {formatDelta(r.delta24h)}
                {r.estimated24h && <span className="text-zinc-400">*</span>} today
              </span>
            </div>
            <Link href={`/repo/${r.owner}/${r.name}`} className="mt-2 break-words font-semibold leading-snug hover:underline after:absolute after:inset-0 after:content-['']">
              <span className="font-normal text-zinc-500 dark:text-zinc-400">{r.owner}/</span>
              {r.name}
            </Link>
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">{repoBlurb(r) ?? r.oneLiner}</p>
            <div className="relative z-10 mt-3 self-start">
              <ShareButton path={`/repo/${r.owner}/${r.name}`} title={r.fullName} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
