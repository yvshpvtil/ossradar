import { repoBlurb } from "@/lib/blurb";
import { abs, breadcrumbLd, linkListLd, ogDefaults, twitterImage } from "@/lib/seo";
import { PageNav } from "@/components/PageNav";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getData, getReposByCategory, rankRepos } from "@/lib/data";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { ago, getLatestRelease } from "@/lib/activity";
import { getHnMentions } from "@/lib/mentions";
import { CompareView, type CompareRow, type PackedRow } from "./CompareView";
import type { Repo } from "@/lib/types";

const title = "Compare GitHub repos side by side";
const description = "Compare up to 3 rising open-source AI and developer-tool repos: stars, growth, forks, language, releases, recent activity and Hacker News discussion.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/compare" },
  openGraph: { ...ogDefaults, title, description, url: "/compare" },
  twitter: { card: "summary_large_image", title, description, ...twitterImage },
};

/** Top-2-by-7d pairs across categories (one pair each), for starter links + ItemList. */
function popularComparisons(limit = 6): { a: Repo; b: Repo; category: string; slug: string }[] {
  const pairs: { a: Repo; b: Repo; category: string; slug: string }[] = [];
  for (const cat of CATEGORIES) {
    if (pairs.length >= limit) break;
    const top = rankRepos(getReposByCategory(cat.slug), "week");
    if (top.length < 2) continue;
    pairs.push({ a: top[0], b: top[1], category: cat.label, slug: cat.slug });
  }
  return pairs;
}

const fmt = (v: number) => v.toLocaleString("en-US");
const compact = (v: number) => (v >= 10_000 ? `${(v / 1000).toFixed(v >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k` : fmt(v));

/** Plain-English, data-backed summary of one head-to-head, rendered on the server so crawlers and AI assistants can read it. */
function headToHead(a: Repo, b: Repo, now: number): string[] {
  const out: string[] = [];
  const [lead, trail] = a.delta7d >= b.delta7d ? [a, b] : [b, a];
  const ratio = trail.delta7d > 0 ? lead.delta7d / trail.delta7d : null;
  const est = a.velocityEstimated || b.velocityEstimated ? " (partly estimated)" : "";
  out.push(
    `${lead.name} gained ${fmt(lead.delta7d)} stars in the last 7 days against ${fmt(trail.delta7d)} for ${trail.name}${est}` +
      (ratio === null ? "." : ratio >= 1.5 ? `, about ${ratio.toFixed(1)} times as many.` : ", a close race."),
  );
  const [big, small] = a.stars >= b.stars ? [a, b] : [b, a];
  out.push(`In total, ${big.name} has ${compact(big.stars)} stars and ${compact(big.forks)} forks; ${small.name} has ${compact(small.stars)} stars and ${compact(small.forks)} forks.`);
  const lang = (r: Repo) => r.language ?? "an unlisted language";
  out.push(
    a.language && a.language === b.language
      ? `Both are written mainly in ${a.language}. ${a.name} was created ${ago(a.createdAt, now)} and ${b.name} ${ago(b.createdAt, now)}.`
      : `${a.name} is written mainly in ${lang(a)} and was created ${ago(a.createdAt, now)}; ${b.name} is mainly ${lang(b)}, created ${ago(b.createdAt, now)}.`,
  );
  const rel = (r: Repo) => {
    const x = getLatestRelease(r.fullName);
    return x ? `${r.name}'s latest release is ${x.tag} (${ago(x.date, now)})` : x === null ? `${r.name} has no tagged release yet` : null;
  };
  const rels = [rel(a), rel(b)].filter(Boolean);
  if (rels.length) out.push(`${rels.join("; ")}.`);
  return out;
}

// Client functions can't be called from a server component, so packing lives here.
function packRow(r: CompareRow): PackedRow {
  const m = r.ownerAvatar.match(/^https:\/\/avatars\.githubusercontent\.com\/u\/(\d+)\?v=4$/);
  return [r.fullName, r.description, m ? m[1] : r.ownerAvatar, r.stars, r.forks, r.delta24h, r.delta7d, r.est ? 1 : 0, r.language, r.category, r.created, r.pushed, r.release, r.hn];
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
  const rows: CompareRow[] = data.repos.map((r) => {
    const rel = getLatestRelease(r.fullName);
    const hn = getHnMentions(r.fullName);
    return {
      fullName: r.fullName, owner: r.owner, name: r.name, description: repoBlurb(r) ?? "", ownerAvatar: r.ownerAvatar,
      stars: r.stars, forks: r.forks, delta24h: r.delta24h, delta7d: r.delta7d, est: r.velocityEstimated,
      language: r.language, category: categoryLabel(r.category), created: ago(r.createdAt, now), pushed: ago(r.pushedAt, now),
      release: rel ? `${rel.tag} (${ago(rel.date, now)})` : rel === null ? "None" : "—",
      hn: hn ? (hn.count ? `${hn.count} stories, ${hn.points.toLocaleString("en-US")} points` : "None") : "—",
    };
  });
  const popular = popularComparisons(6);
  const popularItems = popular.map(({ a, b }) => {
    const name = `${a.fullName} vs ${b.fullName}`;
    const path = `/compare?r=${encodeURIComponent(`${a.fullName},${b.fullName}`)}`;
    return { name, url: abs(path), path };
  });
  return (
    <div>
      <JsonLd data={linkListLd("Popular GitHub repo comparisons", popularItems.map(({ name, url }) => ({ name, url })))} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }])} />
      <PageNav crumbs={[{ name: "Compare" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Compare</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Compare repos side by side</h1>
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
        <CompareView packed={rows.map(packRow)} />
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
                  <Link href={`/repo/${a.owner}/${a.name}`} className="hover:underline">{a.name}</Link>
                  <span className="font-normal text-zinc-500"> vs </span>
                  <Link href={`/repo/${b.owner}/${b.name}`} className="hover:underline">{b.name}</Link>
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
