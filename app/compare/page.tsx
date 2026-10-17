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
import { CompareView, type CompareRow } from "./CompareView";
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
function popularComparisons(limit = 6): { a: Repo; b: Repo }[] {
  const pairs: { a: Repo; b: Repo }[] = [];
  for (const cat of CATEGORIES) {
    if (pairs.length >= limit) break;
    const top = rankRepos(getReposByCategory(cat.slug), "week");
    if (top.length < 2) continue;
    pairs.push({ a: top[0], b: top[1] });
  }
  return pairs;
}

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
        <CompareView rows={rows} />
      </Suspense>
    </div>
  );
}
