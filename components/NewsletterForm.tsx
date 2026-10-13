// Signups go to Beehiiv's free hosted subscribe flow (no paid API needed):
// ossradar.beehiiv.com/subscribe?email=... opens the publication's signup modal prefilled.
export const BEEHIIV_SUBSCRIBE_URL = "https://ossradar.beehiiv.com/subscribe";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action={BEEHIIV_SUBSCRIBE_URL} method="get" target="_blank" rel="noopener" className={compact ? "" : "rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"}>
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
          name="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          Subscribe
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-500">Opens Beehiiv to confirm your subscription.</p>
    </form>
  );
}
