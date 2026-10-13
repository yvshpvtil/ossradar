import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import type { Repo } from "@/lib/types";
import { SponsorSlot } from "./SponsorSlot";

/** Desktop-only left rail on the home page: categories with live counts, shortcuts, sponsor card. */
export function HomeSidebar({ repos, newCount }: { repos: Repo[]; newCount: number }) {
  const counts: Record<string, number> = {};
  for (const r of repos) counts[r.category] = (counts[r.category] ?? 0) + 1;
  const item = "flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 space-y-6">
        <nav aria-label="Shortcuts" className="space-y-0.5">
          <Link href="/new" className={`${item} bg-indigo-50 font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70`}>
            <span>New repos</span>
            <span className="tabular-nums text-xs">{newCount}</span>
          </Link>
          <Link href="/watchlist" className={item}><span>★ Watchlist</span></Link>
        </nav>
        <nav aria-labelledby="side-cats">
          <h2 id="side-cats" className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Categories</h2>
          <ul className="space-y-0.5">
            {CATEGORIES.filter((c) => counts[c.slug]).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className={item}>
                  <span>{c.label}</span>
                  <span className="tabular-nums text-xs text-zinc-400 dark:text-zinc-500">{counts[c.slug]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <SponsorSlot variant="card" />
      </div>
    </aside>
  );
}
