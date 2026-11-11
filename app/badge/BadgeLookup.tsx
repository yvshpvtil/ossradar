"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeEmbed } from "@/components/BadgeEmbed";

/** Finds a tracked repo from a GitHub URL or owner/name and shows its README badge snippets. */
export function BadgeLookup({ tracked, siteUrl }: { tracked: [string, number][]; siteUrl: string }) {
  const [value, setValue] = useState("");
  const m = value.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git$|\/$/g, "").match(/^([\w.-]+)\/([\w.-]+)/);
  const full = m ? `${m[1]}/${m[2]}` : null;
  const hit = full ? tracked.find(([t]) => t.toLowerCase() === full.toLowerCase()) : undefined;
  const [owner, name] = hit ? hit[0].split("/") : [];
  return (
    <div>
      <label htmlFor="badge-repo" className="block text-sm font-medium">Your GitHub repo</label>
      <input
        id="badge-repo"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://github.com/owner/name"
        className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {value && !full && <p className="mt-2 text-sm text-red-600 dark:text-red-400">Enter a GitHub repo like owner/name.</p>}
      {hit && <BadgeEmbed owner={owner} name={name} siteUrl={siteUrl} width={hit[1]} />}
      {full && !hit && (
        <p role="status" className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {full} isn&apos;t tracked yet, so its badge would read &ldquo;not tracked&rdquo;. If it&apos;s an open-source AI or developer tool,{" "}
          <Link className="underline" href="/submit">suggest it</Link>.
        </p>
      )}
    </div>
  );
}
