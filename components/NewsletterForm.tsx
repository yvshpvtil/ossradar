import Script from "next/script";
import { SITE } from "@/lib/site";

/**
 * Newsletter signup.
 * - If SITE.beehiivEmbedUrl is set: renders Beehiiv's embedded subscribe form (iframe), which subscribes
 *   in place on our page (free plan; Beehiiv may show an inline bot check only for suspicious traffic).
 * - Otherwise: plain email form that opens Beehiiv's hosted signup prefilled (interim fallback).
 */
export function NewsletterForm({ compact = false, id = "main" }: { compact?: boolean; id?: string }) {
  const embed = SITE.beehiivEmbedUrl;
  return (
    <div className={compact ? "" : "rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"}>
      {compact ? (
        <p className="mb-2 text-sm font-medium">Get the top risers in your inbox. Free, weekly, one line each.</p>
      ) : (
        <>
          <p className="font-semibold">Get the weekly radar</p>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            The fastest-rising AI &amp; dev-tool repos of the week, one line each. No spam, unsubscribe anytime.
          </p>
        </>
      )}
      {embed ? (
        <>
          <iframe
            src={embed}
            title="Subscribe to the OSS Radar newsletter"
            className="beehiiv-embed block w-full"
            data-test-id="beehiiv-embed"
            height={compact ? 60 : 80}
            frameBorder={0}
            scrolling="no"
            loading="lazy"
            style={{ margin: 0, borderRadius: 0, backgroundColor: "transparent", width: "100%" }}
          />
          {embed.includes("subscribe-forms.beehiiv.com") && (
            <Script src="https://subscribe-forms.beehiiv.com/embed.js" strategy="lazyOnload" />
          )}
        </>
      ) : (
        <form action={SITE.beehiivSubscribeUrl} method="get" target="_blank" className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`nl-email-${id}`} className="sr-only">
            Email address
          </label>
          <input
            id={`nl-email-${id}`}
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
