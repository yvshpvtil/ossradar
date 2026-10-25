import Link from "next/link";
import { topicLabel } from "@/lib/topics";

/** Chip row of related /topic hubs, shown under a hub page's intro. */
export function RelatedTopics({ topics }: { topics: { slug: string }[] }) {
  if (topics.length === 0) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-zinc-500">Related topics:</span>
      {topics.map((t) => (
        <Link key={t.slug} href={`/topic/${t.slug}`} className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300">{topicLabel(t.slug)}</Link>
      ))}
    </p>
  );
}
