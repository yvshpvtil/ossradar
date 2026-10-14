"use client";

import { useState } from "react";

export function BadgeEmbed({ owner, name, siteUrl, width }: { owner: string; name: string; siteUrl: string; width: number }) {
  const img = `${siteUrl}/badge/${owner}/${name}`;
  const page = `${siteUrl}/repo/${owner}/${name}`;
  const md = `[![Trending on OSS Radar](${img})](${page})`;
  const html = `<a href="${page}"><img src="${img}" alt="Trending on OSS Radar"></a>`;
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (k: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(k);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked; text is still selectable */
    }
  };
  return (
    <section className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="mb-1 text-sm font-semibold">Maintainer? Add the badge to your README</h2>
      <p className="mb-3 text-xs text-zinc-500">Shows your live OSS Radar rank and links back here. Updates hourly.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/badge/${owner}/${name}`} alt="OSS Radar badge preview" width={width} height={20} className="mb-3 h-5" />
      {[
        ["Markdown", md],
        ["HTML", html],
      ].map(([k, text]) => (
        <div key={k} className="mb-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded bg-zinc-100 px-2 py-1 font-mono text-xs dark:bg-zinc-900">{text}</code>
          <button
            type="button"
            onClick={() => copy(k, text)}
            className="shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs hover:border-indigo-400 dark:border-zinc-700"
          >
            {copied === k ? "Copied!" : `Copy ${k}`}
          </button>
        </div>
      ))}
    </section>
  );
}
