import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, staticPageLd, ogDefaults, pageAlternates, repoPath, twitterDefaults } from "@/lib/seo";
import { PageNav } from "@/components/PageNav";
import { JsonLd } from "@/components/JsonLd";
import { getRepos, rankRepos } from "@/lib/data";
import { badgeSpec } from "@/lib/badge";
import { SITE } from "@/lib/site";
import { BadgeLookup } from "./BadgeLookup";

// <title> gets the " · OSS Radar" suffix from the root template, so the page title stays brand-free;
// social cards and JSON-LD have no suffix, so they carry the brand in the name.
const title = "README badge for your GitHub repo";
const socialTitle = `${SITE.name} README badge for your GitHub repo`;
const description = `Add a live ${SITE.name} badge to your README. It shows your repo's trending rank by daily star growth, updates hourly and links to its star history page.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: pageAlternates("/badge"),
  openGraph: { siteName: ogDefaults.siteName, locale: ogDefaults.locale, type: ogDefaults.type, images: ogDefaults.images, title: socialTitle, description, url: "/badge" },
  twitter: { ...twitterDefaults, title: socialTitle, description },
};

export default function BadgePage() {
  const repos = getRepos();
  const top = rankRepos(repos, "today").slice(0, 5);
  const tracked: [string, number][] = repos.map((r) => [r.fullName, badgeSpec(r).width]);
  const pattern = `[![Trending on OSS Radar](${SITE.url}/badge/{owner}/{name})](${SITE.url}/repo/{owner}/{name})`;
  return (
    <div className="max-w-2xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "README badge", path: "/badge" }])} />
      <JsonLd data={staticPageLd({ name: socialTitle, description, path: "/badge" })} />
      <PageNav crumbs={[{ name: "README badge" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">For maintainers</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">README badge</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Every repo {SITE.name} tracks gets a small SVG badge you can put in its README. It shows the repo&apos;s live rank and links to its{" "}
        {SITE.name} page with star history, growth stats and similar projects. It&apos;s free and needs no sign-up.
      </p>
      <div className="mt-6 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <BadgeLookup tracked={tracked} siteUrl={SITE.url} />
      </div>
      <section aria-labelledby="badge-states" className="mt-10 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <h2 id="badge-states" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">What the badge shows</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong className="text-zinc-900 dark:text-zinc-100">Trending #N</strong> (green) when the repo is in the top 100 of the leaderboard by stars gained in the last 24 hours.</li>
          <li><strong className="text-zinc-900 dark:text-zinc-100">Tracked</strong> (gray) when it&apos;s tracked but outside today&apos;s top 100.</li>
          <li><strong className="text-zinc-900 dark:text-zinc-100">not tracked</strong> when {SITE.name} doesn&apos;t follow the repo, for example after it drops out of the tracked set.</li>
        </ul>
        <p>
          The rank is recalculated every hour from GitHub star counts, the same data as the <Link className="underline" href="/">leaderboard</Link>.
          Adding the badge doesn&apos;t change a repo&apos;s rank; see <Link className="underline" href="/about">how the rankings work</Link>.
        </p>
      </section>
      <section aria-labelledby="badge-embed" className="mt-10 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <h2 id="badge-embed" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Embed code</h2>
        <p>Replace <code>{"{owner}"}</code> and <code>{"{name}"}</code> with your repo, or look it up above to copy ready-made Markdown and HTML. Each tracked repo&apos;s page has the same snippets.</p>
        <pre className="overflow-x-auto rounded bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-900">{pattern}</pre>
      </section>
      {top.length > 0 && (
        <section aria-labelledby="badge-live" className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
          <h2 id="badge-live" className="mb-3 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Live badges for today&apos;s top repos</h2>
          <ul className="space-y-2">
            {top.map((r) => (
              <li key={r.fullName} className="flex flex-wrap items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/badge/${r.owner}/${r.name}`} alt={`OSS Radar badge for ${r.fullName}`} width={badgeSpec(r).width} height={20} loading="lazy" decoding="async" className="h-5" />
                <Link className="underline" href={repoPath(r)}>{r.fullName}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
