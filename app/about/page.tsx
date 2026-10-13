import type { Metadata } from "next";
import Link from "next/link";
import { EstimateNote } from "@/components/EstBadge";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `How ${SITE.name} finds and ranks the fastest-rising open-source AI and developer-tool repos.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 text-zinc-700 dark:text-zinc-300">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">About OSS Radar</h1>
      <p>
        {SITE.name} (<strong>OSS = Open-Source Software</strong>) is a daily tracker of the fastest-rising open-source AI and developer-tool repositories on GitHub.
        Instead of ranking by total stars (which rewards age), it ranks by <strong>star velocity</strong>: stars gained in
        the last 24 hours and the last 7 days. Each repo gets a one-line take on what it does and why it matters.
      </p>

      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">How it works</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Once a day a GitHub Action queries the GitHub Search API for repos created in the last ~90 days around topics
          like LLMs, AI agents, MCP, RAG and vector databases, local LLMs, coding agents and DevOps, plus recently active
          popular repos in the same space.
        </li>
        <li>It stores a snapshot of every repo&apos;s star count, keyed by date.</li>
        <li>
          Star gains are computed by diffing today&apos;s snapshot against the snapshots from 1 and 7 days ago. Repos are
          grouped into categories using their GitHub topics and description.
        </li>
        <li>The site is rebuilt as static pages, so it&apos;s fast and cheap to run.</li>
      </ol>

      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">About the estimates</h2>
      <EstimateNote />

      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Who&apos;s behind it</h2>
      <p>
        Built by <a className="underline" href={SITE.github}>{SITE.owner}</a>. Want your product in front of this
        audience? See <Link className="underline" href="/sponsor">sponsorship</Link>. You can also follow along via{" "}
        <a className="underline" href="/rss.xml">RSS</a>.
      </p>

      <NewsletterForm />
    </div>
  );
}
