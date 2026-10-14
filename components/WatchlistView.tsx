"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatDelta, formatNumber } from "@/lib/format";
import type { LeaderRepo } from "@/lib/leader";
import { useWatchlist } from "@/lib/watch";
import { EstBadge } from "./EstBadge";
import { WatchButton } from "./WatchButton";

export function WatchlistView({ repos, showMovement }: { repos: LeaderRepo[]; showMovement: boolean }) {
  const { list } = useWatchlist();
  const rank = useMemo(() => {
    const m = new Map<string, number>();
    [...repos].sort((a, b) => b.delta24h - a.delta24h || b.stars - a.stars).forEach((r, i) => m.set(r.fullName, i + 1));
    return m;
  }, [repos]);
  const byName = useMemo(() => new Map(repos.map((r) => [r.fullName, r])), [repos]);

  if (list.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        Nothing here yet. Head to the <Link href="/" className="text-indigo-700 underline underline-offset-2 dark:text-indigo-400">leaderboard</Link> and tap ☆ next to repos you want to follow.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {list.map((name) => {
        const r = byName.get(name);
        if (!r) {
          return (
            <li key={name} className="flex items-center gap-3 px-4 py-3 text-sm">
              <a href={`https://github.com/${name}`} className="flex-1 font-medium hover:underline">{name}</a>
              <span className="text-xs text-zinc-500">No longer in the tracked list</span>
              <WatchButton fullName={name} />
            </li>
          );
        }
        const cur = rank.get(name);
        const move = showMovement && r.prevRank != null && cur != null ? r.prevRank - cur : null;
        return (
          <li key={name} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <Link href={`/repo/${r.owner}/${r.name}`} className="block break-words font-medium hover:underline sm:inline">
                  <span className="block text-xs font-normal text-zinc-500 sm:inline sm:text-[length:inherit] sm:font-medium dark:text-zinc-400">{r.owner}/</span>
                  {r.name}
                </Link>
                <p className="line-clamp-1 text-sm text-zinc-600 dark:text-zinc-400">{r.oneLiner}</p>
              </div>
              <WatchButton fullName={name} />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
              <Stat label="Stars" value={`★ ${formatNumber(r.stars)}`} />
              <Stat label="Last hour" value={r.delta1h == null ? "—" : formatDelta(r.delta1h)} />
              <Stat label="24h" value={<>{formatDelta(r.delta24h)}{r.estimated24h && <EstBadge />}</>} />
              <Stat label="7d" value={<>{formatDelta(r.delta7d)}{r.estimated7d && <EstBadge />}</>} />
              <Stat
                label="Rank today"
                value={
                  <>
                    #{cur}
                    {move != null && move !== 0 && (
                      <span className={move > 0 ? "ml-1 text-emerald-700 dark:text-emerald-400" : "ml-1 text-rose-600"}>
                        {move > 0 ? "▲" : "▼"}{Math.abs(move)}
                      </span>
                    )}
                  </>
                }
              />
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
