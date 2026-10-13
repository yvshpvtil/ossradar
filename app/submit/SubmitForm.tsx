"use client";

import Link from "next/link";
import { useState } from "react";

const ISSUE = "https://github.com/yvshpvtil/ossradar/issues/new";

/** Parses owner/name from a URL or slug, tells you if we already track it, else links to a prefilled GitHub issue. */
export function SubmitForm({ tracked }: { tracked: string[] }) {
  const [value, setValue] = useState("");
  const [why, setWhy] = useState("");
  const m = value.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git$|\/$/g, "").match(/^([\w.-]+)\/([\w.-]+)/);
  const full = m ? `${m[1]}/${m[2]}` : null;
  const known = full ? tracked.find((t) => t.toLowerCase() === full.toLowerCase()) : undefined;
  const url = full
    ? `${ISSUE}?template=submit-repo.yml&title=${encodeURIComponent(`Submit: ${full}`)}&repo=${encodeURIComponent(`https://github.com/${full}`)}&why=${encodeURIComponent(why)}`
    : "";
  const mail = full ? `mailto:hello@ossradar.net?subject=${encodeURIComponent(`Submit: ${full}`)}&body=${encodeURIComponent(`https://github.com/${full}\n\n${why}`)}` : "";
  return (
    <div className="space-y-3">
      <label htmlFor="sub-repo" className="block text-sm font-medium">GitHub repo</label>
      <input
        id="sub-repo"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://github.com/owner/name"
        className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <label htmlFor="sub-why" className="block text-sm font-medium">What it does <span className="font-normal text-zinc-500">(optional)</span></label>
      <textarea
        id="sub-why"
        value={why}
        onChange={(e) => setWhy(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {value && !full && <p className="text-sm text-red-600 dark:text-red-400">Enter a GitHub repo like owner/name.</p>}
      {known ? (
        <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          We already track this one: <Link className="font-medium underline" href={`/repo/${known}`}>{known}</Link>.
        </p>
      ) : (
        full && (
          <div className="flex flex-wrap items-center gap-3">
            <a href={url} target="_blank" rel="noopener" className="inline-flex h-10 items-center rounded-md bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-500">
              Submit via GitHub →
            </a>
            <a href={mail} className="text-sm text-zinc-600 underline dark:text-zinc-400">No GitHub account? Email it instead</a>
          </div>
        )
      )}
    </div>
  );
}
