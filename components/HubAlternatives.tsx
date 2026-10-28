import Link from "next/link";
import { altLabel, alternativesPath, hasAlternativesPage } from "@/lib/alternatives";
import type { Repo } from "@/lib/types";

/**
 * Links a category, topic or language hub to the alternatives pages of its member repos. Before this, an
 * alternatives page was only reachable from the /alternatives index and its own repo page,
 * so most had 2-4 inbound links. Collapsed so it doesn't crowd the leaderboard; sorted by
 * total stars, since people look for alternatives to the tools they already know.
 */
export function HubAlternatives({ repos, label, sameCategory = true }: { repos: Repo[]; label: string; sameCategory?: boolean }) {
  const withAlts = repos.filter(hasAlternativesPage).sort((a, b) => b.stars - a.stars);
  if (withAlts.length === 0) return null;
  return (
    <details className="mt-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <summary className="cursor-pointer text-sm font-semibold">
        Find alternatives to {withAlts.length} {label} {withAlts.length === 1 ? "repo" : "repos"}{" "}
        <span className="font-normal text-zinc-500">(most-starred first)</span>
      </summary>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        {sameCategory
          ? <>Each page lists other tracked repos, mostly {label}, that share at least two GitHub topics with it.</>
          : <>Each page lists other tracked repos, mostly from the same category, that share at least two GitHub topics with it.</>}{" "}
        <Link className="underline" href="/alternatives">Browse all alternatives</Link>.
      </p>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3 [&_a]:text-zinc-700 [&_a:hover]:underline dark:[&_a]:text-zinc-300 [&_li]:break-words">
        {withAlts.map((r) => (
          <li key={r.fullName}>
            <Link prefetch={false} href={alternativesPath(r)}>{altLabel(r)} alternatives</Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
