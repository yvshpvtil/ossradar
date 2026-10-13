"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "ok" | "error";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: (e.currentTarget.elements.namedItem("website") as HTMLInputElement)?.value }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(body.message ?? "Something went wrong");
      setStatus("ok");
      setMessage(body.message ?? "You're in. Watch your inbox.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "" : "rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"}>
      {!compact && (
        <>
          <p className="font-semibold">Get the weekly radar</p>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            The fastest-rising AI &amp; dev-tool repos of the week, one line each. No spam, unsubscribe anytime.
          </p>
        </>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={compact ? "nl-email-compact" : "nl-email"} className="sr-only">
          Email address
        </label>
        <input
          id={compact ? "nl-email-compact" : "nl-email"}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {/* Honeypot field for bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {status !== "idle" && status !== "loading" && (
        <p role="status" className={`mt-2 text-sm ${status === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
