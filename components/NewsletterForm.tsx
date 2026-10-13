"use client";

import Link from "next/link";
import { useState } from "react";

/** Native signup form (Kit-backed via /api/subscribe). Use once per page; elsewhere use <SubscribeButton/>. */
export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), website: fd.get("website") }),
      });
      const j = await res.json();
      setMsg(j.message);
      setState(j.ok ? "done" : "error");
    } catch {
      setMsg("Network error. Please try again.");
      setState("error");
    }
  }

  return (
    <div id="subscribe" className="scroll-mt-24">
      {state === "done" ? (
        <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {msg || "You're in! First issue lands tomorrow."}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="nl-email" className="sr-only">Email address</label>
          <input
            id="nl-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <button
            type="submit"
            disabled={state === "loading"}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {state === "loading" ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      )}
      {state === "error" && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{msg}</p>}
    </div>
  );
}

/** Footer CTA: jumps to the in-page form when present, else to the home hero form. */
export function SubscribeButton() {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="font-semibold">Get the weekly radar</p>
      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
        The fastest-rising AI &amp; dev-tool repos of the week, one line each. Free, no spam.
      </p>
      <Link href="/#subscribe" className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
        Subscribe free
      </Link>
    </div>
  );
}
