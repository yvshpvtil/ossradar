"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { formatDelta, formatNumber } from "@/lib/format";
import type { LeaderRepo } from "@/lib/leader";
import type { CategorySlug } from "@/lib/types";
import { Sparkline } from "./Sparkline";
import { WatchButton } from "./WatchButton";
import { readSinceLastVisit } from "@/lib/watch";
import { RESTORE } from "./BackNav";

type Period = "today" | "week";
const PAGE = 50;
const WEEK_MS = 7 * 86_400_000;

const pill = (active: boolean) =>
  `inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
    active
      ? "border-indigo-600 bg-indigo-600 text-white"
      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
  }`;

export function Leaderboard({
  repos,
  showCategoryFilter = true,
  defaultPeriod = "today",
  newDate = null,
  showMovement = false,
  dataAt,
  generatedAtMs,
}: {
  repos: LeaderRepo[];
  showCategoryFilter?: boolean;
  defaultPeriod?: Period;
  /** Snapshot date whose first-time entries get a "New today" badge (null hides badges). */
  newDate?: string | null;
  /** Show rank movement vs. the previous day (only when 2+ days of data exist). */
  showMovement?: boolean;
  /** generatedAt of the data; enables the "since your last visit" highlight. */
  dataAt?: string;
  /** Reference time for "new this week" (data time, so server and client agree). */
  generatedAtMs?: number;
}) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [category, setCategory] = useState<CategorySlug | "all">("all");
  const [limit, setLimit] = useState(PAGE);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [newWeek, setNewWeek] = useState(false);
  const [sinceVisit, setSinceVisit] = useState<{ newNames: Set<string>; since: string } | null>(null);
  const [onlySince, setOnlySince] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const restored = useRef(false);

  // Coming back (Back button or browser back): restore this page's filters, then its scroll position.
  useEffect(() => {
    const key = `ossr-lb:${location.pathname}`;
    const saved = sessionStorage.getItem(key);
    if (saved && sessionStorage.getItem(RESTORE)) {
      sessionStorage.removeItem(RESTORE);
      try {
        const v = JSON.parse(saved);
        /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage is only readable after mount */
        setPeriod(v.period); setCategory(v.category); setLanguage(v.language); setQuery(v.query); setLimit(v.limit); setNewWeek(v.newWeek);
        /* eslint-enable react-hooks/set-state-in-effect */
        requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, v.scroll ?? 0)));
      } catch {}
    }
    restored.current = true;
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    const key = `ossr-lb:${location.pathname}`;
    // Scroll is captured on click (before navigation resets it), not on every scroll event.
    const save = () => sessionStorage.setItem(key, JSON.stringify({ period, category, language, query, limit, newWeek, scroll: window.scrollY }));
    save();
    document.addEventListener("click", save, true);
    return () => document.removeEventListener("click", save, true);
  }, [period, category, language, query, limit, newWeek]);

  // "/" or Cmd/Ctrl+K jumps to search, like most directory sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!dataAt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setSinceVisit(readSinceLastVisit(dataAt, repos.map((r) => r.fullName)));
  }, [dataAt, repos]);

  const refMs = generatedAtMs ?? 0;
  const languages = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of repos) if (r.language) c[r.language] = (c[r.language] ?? 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [repos]);

  // Current rank by 24h gain over the whole list, for movement arrows.
  const todayRank = useMemo(() => {
    const m = new Map<string, number>();
    [...repos].sort((a, b) => b.delta24h - a.delta24h || b.stars - a.stars).forEach((r, i) => m.set(r.fullName, i + 1));
    return m;
  }, [repos]);

  const ranked = useMemo(() => {
    const key = period === "today" ? "delta24h" : "delta7d";
    const q = query.trim().toLowerCase();
    return repos
      .filter((r) => category === "all" || r.category === category)
      .filter((r) => language === "all" || r.language === language)
      .filter((r) => !newWeek || (refMs && refMs - Date.parse(r.createdAt) <= WEEK_MS))
      .filter((r) => !onlySince || sinceVisit?.newNames.has(r.fullName))
      .filter((r) => !q || r.fullName.toLowerCase().includes(q) || r.oneLiner.toLowerCase().includes(q))
      .sort((a, b) => b[key] - a[key] || b.stars - a.stars);
  }, [repos, period, category, language, newWeek, refMs, query, onlySince, sinceVisit]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of repos) c[r.category] = (c[r.category] ?? 0) + 1;
    return c;
  }, [repos]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Time period" className="inline-flex h-9 shrink-0 rounded-full border border-zinc-300 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
            {(["today", "week"] as const).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={period === p}
                className={`rounded-full px-3.5 text-sm font-medium transition-colors ${period === p ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"}`}
                onClick={() => setPeriod(p)}
              >
                {p === "today" ? "Today" : "This week"}
              </button>
            ))}
          </div>
          <div className="relative min-w-0 flex-1 basis-48">
            <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
            placeholder="Search repos…"
            aria-label="Search repos" aria-keyshortcuts="/ Control+K Meta+K"
            className="h-9 w-full rounded-full border border-zinc-300 bg-white pl-4 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
          />
            <kbd aria-hidden className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-zinc-300 px-1.5 font-mono text-[10px] text-zinc-400 sm:block dark:border-zinc-700">/</kbd>
          </div>
          <select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setLimit(PAGE); }}
            aria-label="Language"
            className="h-9 max-w-full shrink-0 rounded-full border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="all">All languages</option>
            {languages.map(([l, n]) => (
              <option key={l} value={l}>{l} ({n})</option>
            ))}
          </select>
          {refMs > 0 && (
            <button className={pill(newWeek)} aria-pressed={newWeek} onClick={() => { setNewWeek((v) => !v); setLimit(PAGE); }}>
              Created this week
            </button>
          )}
          {sinceVisit && sinceVisit.newNames.size > 0 && (
            <button className={pill(onlySince)} aria-pressed={onlySince} onClick={() => { setOnlySince((v) => !v); setLimit(PAGE); }}>
              New since last visit <span className="tabular-nums opacity-70">{sinceVisit.newNames.size}</span>
            </button>
          )}
        </div>
        {showCategoryFilter && (
          <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800" aria-label="Category filter">
            <button className={pill(category === "all")} onClick={() => { setCategory("all"); setLimit(PAGE); }}>
              All <span className="tabular-nums opacity-60">{repos.length}</span>
            </button>
            {CATEGORIES.filter((c) => counts[c.slug]).map((c) => (
              <button
                key={c.slug}
                className={pill(category === c.slug)}
                onClick={() => { setCategory(c.slug); setLimit(PAGE); }}
              >
                {c.label} <span className="tabular-nums opacity-60">{counts[c.slug]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ol className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {ranked.slice(0, limit).map((r, i) => {
          const delta = period === "today" ? r.delta24h : r.delta7d;
          const est = period === "today" ? r.estimated24h : r.estimated7d;
          const isNew = newDate != null && r.firstSeen === newDate;
          const sinceNew = sinceVisit?.newNames.has(r.fullName) ?? false;
          const cur = todayRank.get(r.fullName);
          const move = showMovement && r.prevRank != null && cur != null ? r.prevRank - cur : null;
          return (
            <li
              key={r.fullName}
              className={`relative cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 flex items-start gap-2 px-3 py-3 sm:items-center sm:gap-3 sm:px-4 ${sinceNew ? "bg-indigo-50/70 dark:bg-indigo-950/30" : ""}`}
            >
              <span className="w-7 shrink-0 pt-0.5 text-right font-mono text-sm tabular-nums text-zinc-400 dark:text-zinc-500 sm:pt-0">
                {i + 1}
                {move != null && move !== 0 && (
                  <span
                    className={`block text-[10px] leading-tight ${move > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}
                    title={`${move > 0 ? "Up" : "Down"} ${Math.abs(move)} since yesterday (24h ranking)`}
                  >
                    {move > 0 ? "▲" : "▼"}{Math.abs(move)}
                  </span>
                )}
              </span>
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
                <Link href={`/repo/${r.owner}/${r.name}`} className="block break-words font-medium hover:underline sm:inline after:absolute after:inset-0 after:content-['']">
                  <span className="block text-xs font-normal text-zinc-500 sm:inline sm:text-[length:inherit] sm:font-medium dark:text-zinc-400">{r.owner}/</span>
                  {r.name}
                </Link>
                {isNew && (
                  <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    New today
                  </span>
                )}
                {sinceNew && !isNew && (
                  <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    New since last visit
                  </span>
                )}
                <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{r.oneLiner}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                  <Link href={`/category/${r.category}`} className="relative z-10 hover:underline">
                    {CATEGORIES.find((c) => c.slug === r.category)?.label}
                  </Link>
                  {r.language && <span>{r.language}</span>}
                  <span className="tabular-nums">★ {formatNumber(r.stars)}</span>
                </p>
              </div>
              <Sparkline points={r.spark} width={80} height={28} className="hidden shrink-0 text-indigo-500 md:block" />
              <div className="w-20 shrink-0 text-right sm:w-24">
                <p
                  className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
                  title={est ? "Estimated: not enough daily snapshots yet (see note above the list)" : undefined}
                >
                  {formatDelta(delta)}
                  {est && <span className="text-zinc-400" aria-label="estimated">*</span>}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{period === "today" ? "stars today" : "stars this week"}</p>
              </div>
              <span className="relative z-10"><WatchButton fullName={r.fullName} /></span>
            </li>
          );
        })}
        {ranked.length === 0 && <li className="px-4 py-8 text-center text-sm text-zinc-500">No repos match these filters.</li>}
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
