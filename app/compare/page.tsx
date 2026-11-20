import { RSS_ALTERNATE, abs, breadcrumbLd, collectionPageLd, linkListLd, ogDefaults, pageAlternates, twitterDefaults } from "@/lib/seo";
import { PageNav } from "@/components/PageNav";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getData } from "@/lib/data";
import { headToHead, popularComparisons } from "@/lib/compareMd";
import { altLabel } from "@/lib/alternatives";
import { CompareView } from "./CompareView";

const title = "Compare GitHub repos side by side";
const description = "Compare up to 3 rising open-source AI and developer-tool repos: stars, growth, forks, language, releases, recent activity and Hacker News discussion.";

const COMPARE_LEAD = "Compare rising AI and dev-tool GitHub repos side by side: star growth, forks, releases and Hacker News buzz.";

/** Meta description naming this week's most popular head-to-heads (as many as fit 158 chars), fixed description as fallback. */
function compareDescription(): string {
  const pairs = popularComparisons().map(({ a, b }) => `${altLabel(a)} vs ${altLabel(b)}`);
  let best: string | null = null;
  for (let k = 1; k <= pairs.length; k++) {
    const shown = pairs.slice(0, k);
    const list = shown.length === 1 ? shown[0] : `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
    const d = `${COMPARE_LEAD} Popular now: ${list}.`;
    if (d.length > 158) break;
    best = d;
  }
  return best ?? description;
}

export function generateMetadata(): Metadata {
  const d = compareDescription();
  return {
    title,
    description: d,
    alternates: { ...pageAlternates("/compare"), types: { ...RSS_ALTERNATE, "text/markdown": [{ url: "/compare.md", title: `${title} (Markdown)` }] } },
    openGraph: { siteName: ogDefaults.siteName, locale: ogDefaults.locale, type: ogDefaults.type, title, description: d, url: "/compare" },
    twitter: { ...twitterDefaults, title, description: d },
  };
}

const GUIDE: { term: string; text: string }[] = [
  { term: "Stars", text: "GitHub's bookmark button. A high total means many developers noticed the project at some point; it says little about whether it is still maintained." },
  { term: "Stars gained (24 hours, 7 days)", text: "Momentum. OSS Radar ranks repos by these gains, so a young project gaining fast can outrank an older one with far more total stars." },
  { term: "Forks", text: "Copies people made to change the code. Many forks relative to stars usually means people are building on it, not just bookmarking it." },
  { term: "Last code push and latest release", text: "Maintenance signals. A recent push shows someone is still working on it; tagged releases show versions you can pin to." },
  { term: "Hacker News", text: "How many HN stories linked the repo and how many points they drew: a rough measure of discussion outside GitHub." },
];

export default function ComparePage() {
  const data = getData();
  const now = Date.parse(data.generatedAt);
  const popular = popularComparisons(6);
  const popularItems = popular.map(({ a, b }) => {
    // Brand spelling for ItemList + "Popular comparisons" anchors (same as meta / head-to-heads).
    const name = `${altLabel(a)} vs ${altLabel(b)}`;
    const path = `/compare?r=${encodeURIComponent(`${a.fullName},${b.fullName}`)}`;
    return { name, url: abs(path), path };
  });
  return (
    <div>
      <JsonLd data={collectionPageLd({ name: title, description: compareDescription(), path: "/compare", dateModified: data.generatedAt, ogCard: true, mainEntity: linkListLd("Popular GitHub repo comparisons", popularItems.map(({ name, url }) => ({ name, url }))) })} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }])} />
      <PageNav crumbs={[{ name: "Compare" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Compare</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Compare GitHub repos side by side</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Pick up to 3 tracked repos to see how they stack up on popularity (stars), momentum (stars gained recently), and maintenance (releases and code pushes).
      </p>
      {popularItems.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Popular comparisons</p>
          <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {popularItems.map((it) => (
              <li key={it.path}>
                <Link href={it.path} className="text-sm text-indigo-700 underline underline-offset-2 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                  {it.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Loading…</p>}>
        <CompareView />
      </Suspense>
      {popular.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">This week&apos;s head-to-heads</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            The two fastest-rising repos in each category over the last 7 days, compared on stars gained, total stars, forks, language, age and releases.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {popular.map(({ a, b, category, slug }, i) => (
              <article key={`${a.fullName}-${b.fullName}`} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <Link href={`/category/${slug}`} className="hover:underline">{category}</Link>
                </p>
                <h3 className="mt-1 font-semibold">
                  <Link href={`/repo/${a.owner}/${a.name}`} className="hover:underline">{altLabel(a)}</Link>
                  <span className="font-normal text-zinc-500"> vs </span>
                  <Link href={`/repo/${b.owner}/${b.name}`} className="hover:underline">{altLabel(b)}</Link>
                </h3>
                <div className="mt-2 space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                  {headToHead(a, b, now).map((t) => <p key={t}>{t}</p>)}
                </div>
                <Link href={popularItems[i].path} className="mt-3 inline-block text-sm text-indigo-700 underline underline-offset-2 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                  See the full comparison table
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="mt-12 max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight">How to compare open-source repos</h2>
        <dl className="mt-3 space-y-3 text-sm">
          {GUIDE.map((g) => (
            <div key={g.term}>
              <dt className="font-medium">{g.term}</dt>
              <dd className="mt-0.5 text-zinc-600 dark:text-zinc-400">{g.text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Stars, forks, pushes and releases come from the public GitHub API and are refreshed hourly; Hacker News figures come from HN&apos;s public search API. Sponsors never affect rankings or comparisons.
        </p>
      </section>
    </div>
  );
}
