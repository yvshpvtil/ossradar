"use client";

import { useState } from "react";

/** Native share sheet where available (mostly mobile), else copy the link. */
export function ShareButton({ path, title, className = "" }: { path: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function onClick() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Share ${title}`}
      className={`inline-flex h-7 items-center rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 ${className}`}
    >
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
