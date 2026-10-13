import type { RepoDetails } from "@/lib/types";

export function RepoDetailsView({ d }: { d: RepoDetails }) {
  if (!d.whoItsFor && d.useCases.length === 0) return null;
  return (
    <section aria-labelledby="who" className="mt-8">
      <h2 id="who" className="mb-2 text-xl font-semibold tracking-tight">Who it&apos;s for</h2>
      {d.whoItsFor && <p className="text-zinc-700 dark:text-zinc-300">{d.whoItsFor}</p>}
      {d.useCases.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 marker:text-indigo-500 dark:text-zinc-300">
          {d.useCases.map((u) => <li key={u}>{u}</li>)}
        </ul>
      )}
    </section>
  );
}
