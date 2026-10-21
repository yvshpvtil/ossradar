import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageNav } from "@/components/PageNav";
import { alternativesPath, getAlternatives, getAlternativesRepos } from "@/lib/alternatives";
import { CATEGORIES } from "@/lib/categories";
import { formatDelta } from "@/lib/format";
import { abs, breadcrumbLd, ogDefaults, twitterImage } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Directory of every alternatives page, grouped by category. Before this, each
// alternatives page was reachable only from its repo page and sibling alternatives pages.
const title = "Open-source alternatives to rising GitHub repos";
const socialTitle = "Open-source alternatives to the fastest-rising GitHub repos";

function groups() {
  const repos = getAlternativesRepos().sort((a, b) => b.delta7d - a.delta7d);
  return CATEGORIES.map((c) => ({ category: c, repos: repos.filter((r) => r.category === c.slug) })).filter((g) => g.repos.length > 0);
}

export function generateMetadata(): Metadata {
  const total = getAlternativesRepos().length;
  const description = `Open-source alternatives to ${total} trending AI and developer-tool GitHub repos, grouped by category. Each list shows tracked repos sharing its GitHub topics.`;
  return {
    title,
    description,
    alternates: { canonical: "/alternatives" },
    openGraph: { ...ogDefaults, title: socialTitle, description, url: "/alternatives" },
    twitter: { card: "summary_large_image", title: socialTitle, description, ...twitterImage },
  };
}

export default function AlternativesIndex() {
  const gs = groups();
  const total = gs.reduce((n, g) => n + g.repos.length, 0);
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Alternatives", path: "/alternatives" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          url: abs("/alternatives"),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: total,
            itemListElement: gs.flatMap((g) => g.repos).map((r, i) => ({ "@type": "ListItem", position: i + 1, url: abs(alternativesPath(r)), name: `${r.name} alternatives` })),
          },
        }}
      />
      <PageNav crumbs={[{ name: "Alternatives" }]} fallbackHref="/" />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Alternatives</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Open-source alternatives</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {SITE.name} lists open-source alternatives for {total} of the repos it tracks. An alternative is another tracked repo in the same category that shares at
        least two GitHub topics, so it works in a similar problem space; it isn&apos;t necessarily a drop-in replacement. Within each category, repos are ordered by
        stars gained in the last 7 days.
      </p>
      <nav aria-label="Categories" className="mt-4 flex flex-wrap gap-2 text-sm">
        {gs.map((g) => (
          <a key={g.category.slug} href={`#${g.category.slug}`} className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
            {g.category.label} ({g.repos.length})
          </a>
        ))}
      </nav>
      {gs.map((g) => (
        <section key={g.category.slug} id={g.category.slug} className="mt-8 scroll-mt-20">
          <h2 className="text-xl font-semibold tracking-tight">{g.category.label} alternatives</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {g.repos.length} {g.repos.length === 1 ? "repo" : "repos"} · <Link className="underline" href={`/category/${g.category.slug}`}>all trending {g.category.label} repos</Link>
          </p>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {g.repos.map((r) => (
              <li key={r.fullName} className="min-w-0 break-words">
                <Link className="font-medium hover:underline" href={alternativesPath(r)}>{r.name} alternatives</Link>{" "}
                <span className="text-zinc-500">
                  ({getAlternatives(r).length}) · <span className="text-emerald-700 dark:text-emerald-400">{formatDelta(r.delta7d)}/wk</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
