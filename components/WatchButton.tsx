"use client";

import { useWatchlist } from "@/lib/watch";

export function WatchButton({ fullName, withLabel = false }: { fullName: string; withLabel?: boolean }) {
  const { has, toggle } = useWatchlist();
  const on = has(fullName);
  return (
    <button
      type="button"
      onClick={() => toggle(fullName)}
      aria-pressed={on}
      aria-label={on ? `Remove ${fullName} from watchlist` : `Add ${fullName} to watchlist`}
      title={on ? "Remove from watchlist" : "Add to watchlist"}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-base leading-none transition-colors ${
        on ? "text-amber-500" : "text-zinc-400 hover:text-amber-500 dark:text-zinc-500"
      } ${withLabel ? "h-9 border border-zinc-300 px-3.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900" : ""}`}
    >
      {on ? "★" : "☆"}
      {withLabel && <span className="text-zinc-700 dark:text-zinc-300">{on ? "Watching" : "Watch"}</span>}
    </button>
  );
}
