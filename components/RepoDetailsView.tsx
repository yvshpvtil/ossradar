import type { RepoDetails } from "@/lib/types";
import { RunChecker } from "./RunChecker";

const NS = <span className="text-zinc-400 dark:text-zinc-500">Not stated in README</span>;
const gb = (v: number | null) => (v == null ? NS : `${v} GB`);

export function RepoDetailsView({ d }: { d: RepoDetails }) {
  const r = d.requirements;
  const rows: [string, React.ReactNode][] = [
    ["Operating system", r.os ?? NS],
    ["RAM (minimum)", gb(r.ramMinGB)],
    ["RAM (recommended)", gb(r.ramRecommendedGB)],
    ["GPU required", r.gpuRequired == null ? NS : r.gpuRequired ? "Yes" : "No"],
    ["VRAM (minimum)", gb(r.vramMinGB)],
    ["Disk space", gb(r.diskGB)],
    ["Runtime", r.runtime ?? NS],
  ];
  if (r.modelSizes) rows.push(["Model sizes", r.modelSizes]);
  return (
    <>
      {(d.whoItsFor || d.useCases.length > 0) && (
        <section aria-labelledby="who" className="mt-8">
          <h2 id="who" className="mb-2 text-xl font-semibold tracking-tight">Who it&apos;s for</h2>
          {d.whoItsFor && <p className="text-zinc-700 dark:text-zinc-300">{d.whoItsFor}</p>}
          {d.useCases.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 marker:text-indigo-500 dark:text-zinc-300">
              {d.useCases.map((u) => <li key={u}>{u}</li>)}
            </ul>
          )}
        </section>
      )}
      <section aria-labelledby="reqs" className="mt-8">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="reqs" className="text-xl font-semibold tracking-tight">Requirements</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {d.source === "readme" ? "From the project README" : "Inferred (README has little detail)"}
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map(([k, v]) => (
                <tr key={k} className="even:bg-zinc-50/60 dark:even:bg-zinc-900/40">
                  <th scope="row" className="w-2/5 px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">{k}</th>
                  <td className="break-words px-4 py-2 tabular-nums">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {d.installCommand && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Install</p>
            <pre className="overflow-x-auto rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-100 dark:bg-zinc-900"><code>{d.installCommand}</code></pre>
          </div>
        )}
      </section>
      <RunChecker req={r} />
    </>
  );
}
