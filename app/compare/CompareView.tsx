"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export type CompareRow = {
  fullName: string; owner: string; name: string; description: string; ownerAvatar: string;
  stars: number; forks: number; delta24h: number; delta7d: number; est: boolean;
  language: string | null; category: string; created: string; pushed: string; release: string; hn: string;
};

// Rows travel to the client as positional tuples (no repeated keys, avatar
// URLs shortened to the numeric GitHub user id) to keep the page's payload small.
export type PackedRow = [string, string, string, number, number, number, number, 0 | 1, string | null, string, string, string, string, string];
const AVATAR = "https://avatars.githubusercontent.com/u/";
function unpackRow(p: PackedRow): CompareRow {
  const [fullName, description, av, stars, forks, delta24h, delta7d, est, language, category, created, pushed, release, hn] = p;
  const [owner, name] = fullName.split("/");
  const ownerAvatar = /^\d+$/.test(av) ? `${AVATAR}${av}?v=4` : av;
  return { fullName, owner, name, description, ownerAvatar, stars, forks, delta24h, delta7d, est: est === 1, language, category, created, pushed, release, hn };
}

const n = (v: number) => v.toLocaleString("en-US");
const METRICS: { label: string; hint?: string; get: (r: CompareRow) => string; num?: (r: CompareRow) => number }[] = [
  { label: "Stars", hint: "GitHub's bookmark/like count", get: (r) => n(r.stars), num: (r) => r.stars },
  { label: "Gained, last 24h", get: (r) => `+${n(r.delta24h)}${r.est ? "*" : ""}`, num: (r) => r.delta24h },
  { label: "Gained, last 7 days", get: (r) => `+${n(r.delta7d)}${r.est ? "*" : ""}`, num: (r) => r.delta7d },
  { label: "Forks", hint: "Copies people made to modify the code", get: (r) => n(r.forks), num: (r) => r.forks },
  { label: "Language", get: (r) => r.language ?? "n/a" },
  { label: "Category", get: (r) => r.category },
  { label: "Created", get: (r) => r.created },
  { label: "Last code push", get: (r) => r.pushed },
  { label: "Latest release", get: (r) => r.release },
  { label: "Hacker News", get: (r) => r.hn },
];

export function CompareView({ packed }: { packed: PackedRow[] }) {
  const rows = useMemo(() => packed.map(unpackRow), [packed]);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const byName = useMemo(() => new Map(rows.map((r) => [r.fullName.toLowerCase(), r])), [rows]);
  const picked = (params.get("r") ?? "").split(",").map((s) => byName.get(s.trim().toLowerCase())).filter(Boolean).slice(0, 3) as CompareRow[];
  const [q, setQ] = useState("");
  const set = (list: CompareRow[]) => {
    const r = list.map((x) => x.fullName).join(",");
    router.replace(r ? `${pathname}?r=${r}` : pathname, { scroll: false });
  };
  const matches = q.length < 2 ? [] : rows.filter((r) => r.fullName.toLowerCase().includes(q.toLowerCase()) && !picked.includes(r)).slice(0, 8);

  return (
    <div className="mt-6">
      {picked.length < 3 && (
        <div className="relative max-w-md">
          <label htmlFor="cmp-q" className="sr-only">Add a repo</label>
          <input id="cmp-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a repo, e.g. ollama"
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900" />
          {matches.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              {matches.map((m) => (
                <li key={m.fullName}>
                  <button className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => { set([...picked, m]); setQ(""); }}>
                    {m.fullName} <span className="text-zinc-500">· {n(m.stars)} stars</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {picked.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Search above to add a repo. You can also use the “Compare” button on any repo page.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="w-40 p-3 text-left font-medium text-zinc-500"><span className="sr-only">Metric</span></th>
                {picked.map((r) => (
                  <th key={r.fullName} className="p-3 text-left align-top font-normal">
                    <div className="flex items-start gap-2">
                      <Image src={`${r.ownerAvatar}${r.ownerAvatar.includes("?") ? "&" : "?"}s=48`} alt="" width={24} height={24} unoptimized className="mt-0.5 rounded" />
                      <div className="min-w-0">
                        <Link href={`/repo/${r.owner}/${r.name}`} className="font-semibold hover:underline">{r.fullName}</Link>
                        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{r.description}</p>
                      </div>
                    </div>
                    <button className="mt-2 text-xs text-zinc-500 hover:text-red-600" onClick={() => set(picked.filter((p) => p !== r))}>Remove</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => {
                const best = m.num && picked.length > 1 ? Math.max(...picked.map(m.num)) : null;
                return (
                  <tr key={m.label} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                    <th scope="row" className="p-3 text-left font-medium text-zinc-500" title={m.hint}>{m.label}</th>
                    {picked.map((r) => (
                      <td key={r.fullName} className={`p-3 tabular-nums ${best !== null && m.num!(r) === best ? "font-semibold text-emerald-700 dark:text-emerald-400" : ""}`}>{m.get(r)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {picked.some((r) => r.est) && <p className="mt-2 text-xs text-zinc-500">* Estimated: not enough daily snapshots yet, so the gain is approximated.</p>}
    </div>
  );
}
