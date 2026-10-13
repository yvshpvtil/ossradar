import type { Metadata } from "next";
import { SponsorSlot } from "@/components/SponsorSlot";
import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sponsor",
  description: `Put your product in front of developers tracking the fastest-rising open-source AI and dev tools. Weekly sponsorships from $${SITE.sponsorPriceUsd}.`,
  alternates: { canonical: "/sponsor" },
  openGraph: { url: "/sponsor" },
};

export default function SponsorPage() {
  const tracked = getData().repos.length;
  // TODO: set SITE.sponsorPaymentUrl (lib/site.ts) to a real Stripe / Lemon Squeezy payment link.
  const paymentUrl = SITE.sponsorPaymentUrl;
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Sponsor OSS Radar</h1>
      <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
        OSS Radar is read by developers who want to know which open-source AI and developer tools are taking off,
        before everyone else does. One sponsor per week, clearly labeled, never mixed into the rankings.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="font-semibold">Site sponsor bar</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            A one-line message with link at the top of every page (leaderboard, {tracked}+ repo pages, category pages)
            plus the sponsor card on each repo page, for 7 days.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="font-semibold">Newsletter slot</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            A short sponsored blurb (≈50 words + link) at the top of that week&apos;s OSS Radar newsletter issue.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-lg border-2 border-indigo-500 p-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Launch pricing</p>
        <p className="mt-2 text-4xl font-bold">
          ${SITE.sponsorPriceUsd}
          <span className="text-base font-normal text-zinc-500"> / week, both slots</span>
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Early sponsors get the best price: it goes up by ${SITE.sponsorPriceStepUsd} after every sponsorship sold.
          Book now to lock in the current rate.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {paymentUrl ? (
            <a href={paymentUrl} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500">
              Book a week (${SITE.sponsorPriceUsd})
            </a>
          ) : (
            <span
              aria-disabled
              className="cursor-not-allowed rounded-md bg-zinc-300 px-4 py-2 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              title="Payment link not configured yet"
            >
              Online booking coming soon
            </span>
          )}
          <a
            href={`mailto:${SITE.sponsorEmail}?subject=OSS%20Radar%20sponsorship`}
            className="rounded-md border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Email {SITE.sponsorEmail}
          </a>
        </div>
      </section>

      <section className="mt-8 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">The fine print</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sponsorships never affect rankings. The leaderboard is computed from GitHub data only.</li>
          <li>Developer-relevant products only (tools, APIs, infra, hiring for engineering roles). We reserve the right to decline.</li>
          <li>Weeks run Monday to Sunday (UTC). Copy is due by the Friday before.</li>
          <li>Featured listings on the leaderboard are planned. Ask if you&apos;re interested.</li>
        </ul>
      </section>

      <section className="mt-8">
        <p className="mb-2 text-sm text-zinc-500">Here is what the placement looks like:</p>
        <SponsorSlot variant="card" />
      </section>
    </div>
  );
}
