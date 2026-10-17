import Link from "next/link";
import { formatDelta } from "@/lib/format";
import { LEADERBOARD_PAGE } from "@/lib/leader";
import type { Repo } from "@/lib/types";

/**
 * Collapsed A–Z index of every repo on a hub page. The leaderboard only server-renders
 * its first LEADERBOARD_PAGE rows ("Show more" loads the rest client-side), so on big hubs
 * most member repos had no crawlable link from their own hub. Rendered only when rows are hidden.
 */
export function HubIndex({ repos, label }: { repos: Repo[]; label: string }) {
  if (repos.length <= LEADERBOARD_PAGE) return null;
  const sorted = [...repos].sort((a, b) => a.fullName.localeCompare(b.fullName, "en", { sensitivity: "base" }));
  return (
    <details className="mt-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <summary className="cursor-pointer text-sm font-semibold">
        All {repos.length} {label} repos, A–Z <span className="font-normal text-zinc-500">(stars gained this week)</span>
      </summary>
      {/* Styles sit on the list, not each row: big hubs have 150+ rows, rendered in both HTML and the RSC payload. */}
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3 [&_a]:text-zinc-700 [&_a:hover]:underline dark:[&_a]:text-zinc-300 [&_li]:break-words [&_span]:text-xs [&_span]:tabular-nums [&_span]:text-zinc-500">
        {sorted.map((r) => (
          <li key={r.fullName}>
            <Link prefetch={false} href={`/repo/${r.owner}/${r.name}`}>{r.fullName}</Link> <span>{formatDelta(r.delta7d)}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
