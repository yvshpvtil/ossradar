import type { Metadata } from "next";
import { breadcrumbLd, ogDefaults, twitterImage } from "@/lib/seo";
import { PageNav } from "@/components/PageNav";
import Link from "next/link";
import { EstimateNote } from "@/components/EstBadge";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";

const FAQ: { q: string; a: string }[] = [
  { q: "What is OSS Radar?", a: `${SITE.name} (OSS = Open-Source Software) is a free, hourly-updated ranking of the fastest-rising open-source AI and developer-tool repositories on GitHub.` },
  { q: "How are repos ranked?", a: "By star velocity: stars gained in the last 24 hours (Today) or the last 7 days (This week), not by total stars. Ties are broken by total stars." },
  { q: "How often is the data updated?", a: "Every hour. A GitHub Action pulls star counts from the GitHub API and the site is rebuilt with the new numbers." },
  { q: "Why are some numbers marked as estimates?", a: "For repos first seen less than 24 hours or 7 days ago there is no earlier snapshot to diff against, so the gain is estimated as total stars divided by days since the repo was created. Measured numbers replace estimates automatically." },
  { q: "Do sponsors affect the rankings?", a: "No. Rankings are computed from GitHub data only. Sponsor placements are clearly labeled and separate from the leaderboard." },
  { q: "Is there an API?", a: "Yes. /api/v1/trending returns the top 100 repos by 24-hour star gain as JSON. It is free, needs no key and updates hourly." },
];

const title = "How we rank rising GitHub repos";
const description = `How ${SITE.name} ranks the fastest-rising open-source AI and dev-tool repos on GitHub by star velocity (stars gained in 24 hours and 7 days), updated hourly.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: { ...ogDefaults, title, description, url: "/about" },
  twitter: { card: "summary_large_image", title, description, ...twitterImage },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-6 text-zinc-700 dark:text-zinc-300">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <PageNav crumbs={[{ name: "About" }]} fallbackHref={"/"} />
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-zinc-900 dark:text-zinc-100">About OSS Radar</h1>
      <p>
        {SITE.name} (<strong>OSS = Open-Source Software</strong>) is an hourly-updated tracker of the fastest-rising open-source AI and developer-tool repositories on GitHub.
        Instead of ranking by total stars (which rewards age), it ranks by <strong>star velocity</strong>: stars gained in
        the last 24 hours and the last 7 days. Each repo gets a one-line take on what it does and why it matters.
      </p>

      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">How it works</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Every hour a GitHub Action queries the GitHub Search API for repos created in the last ~90 days around topics
          like <Link className="underline" href="/category/llm-tooling">LLM tooling</Link>,{" "}
          <Link className="underline" href="/category/ai-agents">AI agents</Link>,{" "}
          <Link className="underline" href="/category/mcp">MCP</Link>,{" "}
          <Link className="underline" href="/category/rag-vector">RAG and vector databases</Link>,{" "}
          <Link className="underline" href="/category/local-llms">local LLMs</Link>,{" "}
          <Link className="underline" href="/category/coding-agents">coding agents</Link> and{" "}
          <Link className="underline" href="/category/devops">DevOps</Link>, plus recently active popular repos in the same space.
        </li>
        <li>It stores an hourly star count for every repo (last 48 hours) and a daily snapshot keyed by UTC date.</li>
        <li>
          Star gains are computed by diffing the latest counts against those from 24 hours and 7 days earlier. Repos are
          grouped into categories using their GitHub topics and description.
        </li>
        <li>The site is rebuilt as static pages, so it&apos;s fast and cheap to run.</li>
      </ol>

      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">About the estimates</h2>
      <EstimateNote />

      <h2 id="api" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Free data API</h2>
      <p>
        The current leaderboard is available as JSON (a plain data format most programming languages can read) at{" "}
        <a className="underline" href="/api/v1/trending"><code>/api/v1/trending</code></a>: the top 100 repos by stars gained in the last
        24 hours, with 7-day gains, stars, forks, language, category and topics. It updates hourly, needs no key, and is free to use with a
        link back to {SITE.name}.
      </p>

      <h2 id="faq" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">FAQ</h2>
      <dl className="space-y-3">
        {FAQ.map((f) => (
          <div key={f.q}>
            <dt className="font-medium text-zinc-900 dark:text-zinc-100">{f.q}</dt>
            <dd className="mt-0.5">{f.a}</dd>
          </div>
        ))}
      </dl>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Who&apos;s behind it</h2>
      <p>
        Built by <a className="underline" href={SITE.github}>{SITE.owner}</a>. Want your product in front of this
        audience? See <Link className="underline" href="/sponsor">sponsorship</Link>.
      </p>

      <NewsletterForm />
    </div>
  );
}
