import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageNav } from "@/components/PageNav";
import { CATEGORIES } from "@/lib/categories";
import { getReposByCategory, rankRepos } from "@/lib/data";
import { formatDelta } from "@/lib/format";
import { abs, breadcrumbLd, ogDefaults, repoPath, twitterImage } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Directory of every category hub. Before this, bare /category 404'd and category hubs
// had no parent page in their breadcrumb, unlike the language and topic hubs.
const title = "Open-source AI & dev-tool categories, by growth";
const socialTitle = "Browse fast-rising open-source repos by category";

function rows() {
  return CATEGORIES.map((c) => {
    const repos = getReposByCategory(c.slug);
    return { ...c, count: repos.length, week: repos.reduce((n, r) => n + r.delta7d, 0), top: rankRepos(repos, "week")[0] };
  });
}

export function generateMetadata(): Metadata {
  const description = `All ${CATEGORIES.length} category hubs on ${SITE.name}, from AI agents and MCP servers to local LLMs and DevOps, each ranking its tracked GitHub repos by stars gained.`;
  return {
    title,
    description,
    alternates: { canonical: "/category" },
    openGraph: { ...ogDefaults, title: socialTitle, description, url: "/category" },
    twitter: { card: "summary_large_image", title: socialTitle, description, ...twitterImage },
  };
}

export default function CategoryIndex() {
  const rs = rows();
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Categories", path: "/category" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          url: abs("/category"),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: rs.length,
            itemListElement: rs.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/category/${c.slug}`), name: `${c.label} repos` })),
          },
        }}
      />
      <PageNav crumbs={[{ name: "Categories" }]} fallbackHref="/" />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Categories</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Browse rising repos by category</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {SITE.name} sorts every tracked open-source AI and developer-tool repo into one of {rs.length} categories, based on its GitHub topics and description. Each
        category hub ranks its repos by stars gained. Below are all {rs.length}, with how many repos each holds, the stars they gained together in the last 7 days
        and the repo leading this week.
      </p>
      <ul className="mt-6 grid gap-x-6 gap-y-5 text-sm sm:grid-cols-2">
        {rs.map((c) => (
          <li key={c.slug} className="min-w-0 break-words">
            <Link className="font-medium hover:underline" href={`/category/${c.slug}`}>{c.label} repos</Link>{" "}
            <span className="text-zinc-500">
              ({c.count}) · <span className="text-emerald-700 dark:text-emerald-400">{formatDelta(c.week)}/wk</span>
            </span>
            <span className="mt-0.5 block text-zinc-600 dark:text-zinc-400">{c.description}</span>
            {c.top && (
              <span className="block text-xs text-zinc-500">
                Leading: <Link prefetch={false} className="hover:underline" href={repoPath(c.top)}>{c.top.fullName}</Link>
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Or browse by <Link className="underline" href="/language">programming language</Link> or{" "}
        <Link className="underline" href="/topic">GitHub topic</Link>.
      </p>
    </div>
  );
}
