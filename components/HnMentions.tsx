import { formatDate, formatNumber } from "@/lib/format";
import type { HnMention } from "@/lib/mentions";

/** "Discussed on Hacker News" box: count of HN stories linking to the repo and the top one. */
export function HnMentions({ m, fullName }: { m: HnMention; fullName: string }) {
  if (!m.count || !m.top) return null;
  return (
    <section className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-semibold">Discussed on Hacker News</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Hacker News is a popular tech discussion site. {m.count} {m.count === 1 ? "story links" : "stories link"} to this repo, with{" "}
        {formatNumber(m.points)} upvotes (points) in total.
      </p>
      <a href={`https://news.ycombinator.com/item?id=${m.top.id}`} className="mt-3 block rounded-md bg-zinc-50 p-3 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800" rel="noopener">
        <span className="block text-sm font-medium">{m.top.title}</span>
        <span className="mt-0.5 block text-xs text-zinc-500">
          {formatNumber(m.top.points)} points · {formatNumber(m.top.comments)} comments · {formatDate(m.top.date)}
        </span>
      </a>
      {m.count > 1 && (
        <a className="mt-2 inline-block text-xs text-indigo-600 hover:underline dark:text-indigo-400" rel="noopener"
          href={`https://hn.algolia.com/?query=${encodeURIComponent(`github.com/${fullName}`)}&type=story`}>
          See all {m.count} on HN search →
        </a>
      )}
    </section>
  );
}
