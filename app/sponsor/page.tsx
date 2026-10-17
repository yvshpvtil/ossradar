import type { Metadata } from "next";
import { breadcrumbLd, ogDefaults, twitterImage } from "@/lib/seo";
import { PageNav } from "@/components/PageNav";
import { JsonLd } from "@/components/JsonLd";
import { RazorpayButton } from "@/components/RazorpayButton";
import { SponsorSlot } from "@/components/SponsorSlot";
import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { LAUNCH_PRICE_USD, LAUNCH_SLOTS, REGULAR_PRICE_USD, sponsorPricing } from "@/lib/sponsors";
import { getTopics } from "@/lib/topics";
import { getLanguages } from "@/lib/languages";
import { CATEGORIES } from "@/lib/categories";

const title = "Sponsor";
const description = `One clearly labeled sponsor per week across OSS Radar and its daily newsletter. $${LAUNCH_PRICE_USD}/week for the first ${LAUNCH_SLOTS} sponsors, then $${REGULAR_PRICE_USD}/week.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sponsor" },
  openGraph: { ...ogDefaults, title, description, url: "/sponsor" },
  twitter: { card: "summary_large_image", title, description, ...twitterImage },
};

export default function SponsorPage() {
  const data = getData();
  const tracked = data.repos.length;
  const hubPages = CATEGORIES.length + getTopics().length + getLanguages().length;
  const { launchLeft, price } = sponsorPricing();
  const paymentUrl = SITE.sponsorPaymentUrl;
  const mail = `mailto:${SITE.sponsorEmail}?subject=OSS%20Radar%20sponsorship`;
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Sponsor", path: "/sponsor" }])} />
      <PageNav crumbs={[{ name: "Sponsor" }]} fallbackHref={"/"} />
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Sponsor OSS Radar</h1>
      <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
        OSS Radar ranks open-source AI and developer-tool repos by how fast they are gaining GitHub stars, updated every hour.
        Each week has one sponsor, clearly labeled and never mixed into the rankings.
      </p>

      <section className="mt-8 rounded-lg border-2 border-indigo-500 p-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
          {launchLeft > 0 ? `Launch price · ${launchLeft} of ${LAUNCH_SLOTS} slots left` : "Weekly price"}
        </p>
        <p className="mt-2 text-4xl font-bold">
          ${price}
          <span className="text-base font-normal text-zinc-500"> / week, site + newsletter</span>
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          The first {LAUNCH_SLOTS} sponsors pay ${LAUNCH_PRICE_USD}/week. After that the price is ${REGULAR_PRICE_USD}/week.
        </p>
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <RazorpayButton url="https://pages.razorpay.com/pl_TntKzp5KHKdyR4/view" fallbackUrl={paymentUrl || "https://pages.razorpay.com/pl_TntKzp5KHKdyR4/view"} label={`Book a week ($${price})`} />
          <a href={mail} className={paymentUrl ? "rounded-md border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900" : "rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"}>
            Email {SITE.sponsorEmail}
          </a>
        </div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          After paying, email <a href={mail} className="font-medium text-indigo-700 underline dark:text-indigo-400">{SITE.sponsorEmail}</a> with your logo, link and tagline.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">What you get for 7 days</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li><strong>Site-wide sponsor bar</strong>: your name, logo, one-line tagline and link at the top of every page: the leaderboard, {tracked} repo pages, alternatives pages and {hubPages} category, topic and language pages.</li>
          <li><strong>Sponsor card</strong> in the sidebar of the leaderboard and of every repo page.</li>
          <li><strong>Newsletter slot</strong>: your sponsor block at the top of every daily OSS Radar email sent during your week (7 issues).</li>
          <li>Links are marked <code>rel=&quot;sponsored&quot;</code>, as search engines require.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">About the audience</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          OSS Radar launched in October 2026 and currently tracks {tracked} repos with {data.snapshotCount} daily snapshot{data.snapshotCount === 1 ? "" : "s"} of history.
          It is new, which is why launch pricing is low. Email us for current visitor and subscriber numbers before you book; we share the real figures.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">The fine print</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sponsorships never affect rankings. The leaderboard is computed from GitHub data only.</li>
          <li>Developer-relevant products only (tools, APIs, infra, engineering hiring). We may decline any sponsorship.</li>
          <li>Weeks run Monday to Sunday (UTC). Send name, tagline (up to about 90 characters), link and a square logo by the Friday before.</li>
        </ul>
      </section>

      <section className="mt-8">
        <p className="mb-2 text-sm text-zinc-500">Preview of the sponsor card:</p>
        <SponsorSlot variant="card" sponsor={{ name: "Your product", tagline: "One line about what it does for developers.", url: mail, start: "", end: "" }} />
      </section>
    </div>
  );
}
