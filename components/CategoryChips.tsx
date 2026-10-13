import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import type { Repo } from "@/lib/types";

/** Mobile/tablet category switcher: one horizontally scrollable row of chips. Hidden on desktop (sidebar takes over). */
export function CategoryChips({ repos, active }: { repos: Repo[]; active: string }) {
  const counts: Record<string, number> = {};
  for (const r of repos) counts[r.category] = (counts[r.category] ?? 0) + 1;
  const chip = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors ${
      on
        ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
        : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
    }`;
  const items = [{ slug: "all", label: "All", href: "/", n: repos.length },
    ...CATEGORIES.filter((c) => counts[c.slug]).map((c) => ({ slug: c.slug, label: c.label, href: `/category/${c.slug}`, n: counts[c.slug] }))];
  return (
    <nav aria-label="Categories" className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none] lg:hidden">
      <ul className="flex gap-2 pb-1">
        {items.map((c) => (
          <li key={c.slug}>
            <Link href={c.href} aria-current={active === c.slug ? "page" : undefined} className={chip(active === c.slug)}>
              {c.label} <span className="tabular-nums opacity-70">{c.n}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
