import type { Metadata } from "next";
import { breadcrumbLd, staticPageLd, ogDefaults, twitterImage, pageAlternates } from "@/lib/seo";
import { PageNav } from "@/components/PageNav";
import { JsonLd } from "@/components/JsonLd";
import { getRepos } from "@/lib/data";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { SubmitForm } from "./SubmitForm";

const title = "Suggest a rising AI or developer-tool repo";
const description = `Suggest an open-source AI, LLM, agent or MCP repo for ${SITE.name} to track. Free and reviewed by hand; it's ranked purely by the GitHub stars it gains.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: pageAlternates("/submit"),
  openGraph: { ...ogDefaults, title, description, url: "/submit" },
  twitter: { card: "summary_large_image", title, description, ...twitterImage },
};

export default function SubmitPage() {
  const tracked = getRepos().length;
  return (
    <div className="max-w-2xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Submit a repo", path: "/submit" }])} />
      <JsonLd data={staticPageLd({ name: title, description, path: "/submit" })} />
      <PageNav crumbs={[{ name: "Submit a repo" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Submit</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Submit a repo</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Know an open-source AI or developer tool that&apos;s taking off? Suggest it here. Submissions are free and reviewed by hand. Once
        added, a repo is ranked like every other one, purely by the stars it gains, so submitting doesn&apos;t buy a better spot.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
        <li>It must be a public GitHub repo with an open-source license.</li>
        <li>It should be AI, LLM, agent, MCP or developer-tool related.</li>
        <li>You&apos;ll open a short public GitHub issue, which needs a free GitHub account. You can email us instead.</li>
      </ul>
      <div className="mt-6 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <SubmitForm tracked={getRepos().map((r) => r.fullName)} />
      </div>
      <section aria-labelledby="how-tracked" className="mt-10 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <h2 id="how-tracked" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">How repos get on {SITE.name}</h2>
        <p>
          Most repos are found automatically. Every hour, {SITE.name} searches GitHub for two kinds of projects: young repos created in the
          last 90 days that already have at least 25 stars and carry topics like LLM, AI agents, MCP, RAG, local LLMs, coding agents,
          developer tools, CLI, self-hosted, DevOps or observability; and established repos with 2,000+ stars in those areas that were
          updated in the past week. It then keeps the {tracked.toLocaleString("en-US")} repos gaining the most stars this week. So if a
          project is growing fast, there&apos;s a good chance it&apos;s already here; the form above tells you if it is.
        </p>
        <p>
          A submission helps when a project is new, has few GitHub topics, or sits just outside those searches. Once it&apos;s approved,
          it&apos;s tracked every hour from then on, gets its own repo page with star history, and shows up in rankings only when its
          real star growth earns a spot. Approval doesn&apos;t place it on the leaderboard by itself.
        </p>
        <h3 className="pt-2 font-semibold text-zinc-900 dark:text-zinc-100">What isn&apos;t accepted</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Archived repos, private repos and anything that isn&apos;t on GitHub.</li>
          <li>Projects that aren&apos;t software: reading lists, life-advice guides, recipes and similar collections.</li>
          <li>Adult or NSFW projects, even AI ones, since this is a work-safe site.</li>
          <li>Paid placement. Sponsorship is a separate, clearly labeled slot and never changes a repo&apos;s rank.</li>
        </ul>
        <p>
          Want to see what fits? Browse <Link className="underline" href="/new">new AI repos</Link>, the{" "}
          <Link className="underline" href="/category">categories</Link>, or read{" "}
          <Link className="underline" href="/about">how the rankings work</Link>.
        </p>
      </section>
    </div>
  );
}
