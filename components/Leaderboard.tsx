"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { formatDelta, formatNumber } from "@/lib/format";
import type { LeaderRepo } from "@/lib/leader";
import type { CategorySlug } from "@/lib/types";
import { EstBadge } from "./EstBadge";
import { Sparkline } from "./Sparkline";

type Period = "today" | "week";
const PAGE = 50;

const pill = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition-colors ${
    active
      ? "border-indigo-600 bg-indigo-600 text-white"
      : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
  }`;

export function Leaderboard({
  repos,
  showCategoryFilter = true,
  defaultPeriod = "today",
}: {
  repos: LeaderRepo[];
  showCategoryFilter?: boolean;
  defaultPeriod?: Period;
}) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [category, setCategory] = useState<CategorySlug | "all">("all");
  const [limit, setLimit] = useState(PAGE);

  const ranked = useMemo(() => {
    const key = period === "today" ? "delta24h" : "delta7d";
    return repos
      .filter((r) => category === "all" || r.category === category)
      .sort((a, b) => b[key] - a[key] || b.stars - a.stars);
  }, [repos, period, category]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of repos) c[r.category] = (c[r.category] ?? 0) + 1;
    return c;
  }, [repos]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div role="tablist" aria-label="Time period" className="flex gap-2">
          {(["today", "week"] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              className={pill(period === p)}
              onClick={() => setPeriod(p)}
            >
              {p === "today" ? "Today (24h)" : "This week (7d)"}
            </button>
          ))}
        </div>
        {showCategoryFilter && (
          <div className="flex flex-wrap gap-2" aria-label="Category filter">
            <button className={pill(category === "all")} onClick={() => { setCategory("all"); setLimit(PAGE); }}>
              All <span className="opacity-60">{repos.length}</span>
            </button>
            {CATEGORIES.filter((c) => counts[c.slug]).map((c) => (
              <button
                key={c.slug}
                className={pill(category === c.slug)}
                onClick={() => { setCategory(c.slug); setLimit(PAGE); }}
              >
                {c.label} <span className="opacity-60">{counts[c.slug]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ol className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {ranked.slice(0, limit).map((r, i) => {
          const delta = period === "today" ? r.delta24h : r.delta7d;
          const est = period === "today" ? r.estimated24h : r.estimated7d;
          return (
            <li key={r.fullName} className="flex items-start gap-3 px-3 py-3 sm:items-center sm:px-4">
              <span className="w-7 shrink-0 pt-0.5 text-right font-mono text-sm text-zinc-400 sm:pt-0">{i + 1}</span>
              <Image
                src={`${r.ownerAvatar}${r.ownerAvatar.includes("?") ? "&" : "?"}s=48`}
                alt={`${r.owner} avatar`}
                width={24}
                height={24}
                unoptimized
                loading="lazy"
                className="mt-0.5 hidden shrink-0 rounded-full sm:mt-0 sm:block"
              />
              <div className="min-w-0 flex-1">
                <Link href={`/repo/${r.owner}/${r.name}`} className="font-medium hover:underline">
                  <span className="text-zinc-500 dark:text-zinc-400">{r.owner}/</span>
                  {r.name}
                </Link>
                <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{r.oneLiner}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                  <Link href={`/category/${r.category}`} className="hover:underline">
                    {CATEGORIES.find((c) => c.slug === r.category)?.label}
                  </Link>
                  {r.language && <span>{r.language}</span>}
                  <span>★ {formatNumber(r.stars)}</span>
                </p>
              </div>
              <Sparkline points={r.spark} width={80} height={28} className="hidden shrink-0 text-indigo-500 md:block" />
              <div className="w-20 shrink-0 text-right">
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatDelta(delta)}</span>
                {est && <EstBadge />}
                <p className="text-[11px] text-zinc-500">{period === "today" ? "stars / 24h" : "stars / 7d"}</p>
              </div>
            </li>
          );
        })}
        {ranked.length === 0 && <li className="px-4 py-8 text-center text-sm text-zinc-500">No repos in this category yet.</li>}
      </ol>
      {ranked.length > limit && (
        <div className="mt-4 text-center">
          <button className={pill(false)} onClick={() => setLimit((l) => l + PAGE)}>
            Show more ({ranked.length - limit} left)
          </button>
        </div>
      )}
    </div>
  );
}
