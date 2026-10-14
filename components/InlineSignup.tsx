"use client";

import { useEffect, useState } from "react";
import { NewsletterForm, SUBSCRIBED_KEY } from "./NewsletterForm";

const DISMISS_KEY = "ossr-signup-dismissed";

/** Inline (in-flow, never a popup) newsletter card. Hidden for people who already subscribed or dismissed it. */
export function InlineSignup({ source, className = "" }: { source: string; className?: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
      if (localStorage.getItem(SUBSCRIBED_KEY) || localStorage.getItem(DISMISS_KEY)) setHidden(true);
    } catch {}
  }, []);
  if (hidden) return null;
  return (
    <aside aria-label="Newsletter signup" className={`relative rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/30 ${className}`}>
      <button
        type="button"
        aria-label="Dismiss newsletter signup"
        onClick={() => { setHidden(true); try { localStorage.setItem(DISMISS_KEY, "1"); } catch {} }}
        className="absolute right-2 top-2 rounded px-1.5 text-lg leading-none text-zinc-500 hover:bg-indigo-100 hover:text-zinc-800 dark:hover:bg-indigo-900/50 dark:hover:text-zinc-200"
      >
        ×
      </button>
      <p className="pr-6 font-semibold text-zinc-900 dark:text-zinc-100">Catch the next breakout repo early</p>
      <p className="mb-3 mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">The 10 fastest-rising open-source AI &amp; dev tools, one email every day.</p>
      <NewsletterForm source={source} anchor={false} />
    </aside>
  );
}
