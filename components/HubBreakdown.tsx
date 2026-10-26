import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getLanguages } from "@/lib/languages";
import type { Repo } from "@/lib/types";

/**
 * One data-driven sentence that cross-links a hub to the other hub dimension: a category or topic page
 * lists its main languages, a language or topic page its categories. Only dimensions with their own hub
 * are linked, most repos first, so thin hubs gain unique text and crawl paths between /category and /language.
 */
export function HubBreakdown({ repos, by, max = 5 }: { repos: Repo[]; by: "language" | "category"; max?: number }) {
  const counts = new Map<string, number>();
  for (const r of repos) {
    const key = by === "language" ? r.language : r.category;
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const hubs =
    by === "language"
      ? getLanguages().map((l) => ({ key: l.name, label: l.name, href: `/language/${l.slug}` }))
      : CATEGORIES.map((c) => ({ key: c.slug as string, label: c.label, href: `/category/${c.slug}` }));
  const items = hubs
    .filter((h) => counts.has(h.key))
    .map((h) => ({ ...h, n: counts.get(h.key)! }))
    .sort((a, b) => b.n - a.n)
    .slice(0, max);
  if (items.length < 2) return null;
  return (
    <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
      {by === "language" ? "Main languages" : "By category"}:{" "}
      {items.map((h, i) => (
        <span key={h.key}>
          {i > 0 && (i === items.length - 1 ? " and " : ", ")}
          <Link className="underline" href={h.href}>{h.label}</Link> ({h.n})
        </span>
      ))}
      .
    </p>
  );
}
