import type { Metadata } from "next";
import { PageNav } from "@/components/PageNav";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { EstBadge } from "@/components/EstBadge";
import { alternativesPath, getAlternatives, getAlternativesRepos, getRepo, hasAlternativesPage } from "@/lib/alternatives";
import { categoryLabel } from "@/lib/categories";
import { formatDelta, formatNumber } from "@/lib/format";
import { stripWhy } from "@/lib/why";
import { abs, alternativesPageTitle, breadcrumbLd, clip, collectionPageLd, repoPath, ogDefaults, twitterImage } from "@/lib/seo";
import { getData } from "@/lib/data";
import type { Repo } from "@/lib/types";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return getAlternativesRepos().map((r) => ({ owner: r.owner, name: r.name }));
}

/** Title and description shared by the page metadata and its CollectionPage JSON-LD, so they can't drift. */
function alternativesMeta(repo: Repo) {
  const alts = getAlternatives(repo);
  return {
    title: alternativesPageTitle(repo.name, alts.length),
    description: clip(
      `Open-source alternatives to ${repo.fullName}: ${alts.slice(0, 3).map((a) => a.repo.fullName).join(", ")} and more. ${categoryLabel(repo.category)} repos sharing its GitHub topics, ranked by stars gained this week.`,
    ),
  };
}

export async function generateMetadata({ params }: PageProps<"/alternatives/[owner]/[name]">): Promise<Metadata> {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo || !hasAlternativesPage(repo)) return {};
  const alts = getAlternatives(repo);
  const { title, description } = alternativesMeta(repo);
  const shareTitle = `${alts.length} open-source ${repo.name} alternatives on GitHub`;
  const url = alternativesPath(repo);
  return { title, description, alternates: { canonical: url }, openGraph: { ...ogDefaults, title: shareTitle, description, url }, twitter: { card: "summary_large_image", title: shareTitle, description, ...twitterImage } };
}

export default async function AlternativesPage({ params }: PageProps<"/alternatives/[owner]/[name]">) {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo || !hasAlternativesPage(repo)) notFound();
  const alts = getAlternatives(repo);
  const path = alternativesPath(repo);
  const cat = categoryLabel(repo.category);
  return (
    <article className="max-w-3xl">
      <JsonLd
        data={{
          ...collectionPageLd({
            name: alternativesMeta(repo).title,
            description: alternativesMeta(repo).description,
            path,
            dateModified: getData().generatedAt,
            mainEntity: {
              "@type": "ItemList",
              name: `Open-source alternatives to ${repo.fullName}`,
              numberOfItems: alts.length,
              itemListElement: alts.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: abs(repoPath(a.repo)), name: a.repo.fullName })),
            },
          }),
          about: { "@type": "SoftwareSourceCode", name: repo.fullName, url: abs(repoPath(repo)), codeRepository: repo.url },
        }}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Categories", path: "/category" },
          { name: cat, path: `/category/${repo.category}` },
          { name: repo.fullName, path: repoPath(repo) },
          { name: "Alternatives", path },
        ])}
      />
      <PageNav fallbackHref={repoPath(repo)} crumbs={[{ name: "Categories", href: "/category" }, { name: cat, href: `/category/${repo.category}` }, { name: repo.fullName, href: repoPath(repo) }, { name: "Alternatives" }]} />
      <h1 className="text-3xl font-bold tracking-tight">{repo.name} alternatives</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        <Link className="underline" href={repoPath(repo)}>{repo.fullName}</Link> ({formatNumber(repo.stars)} stars, {formatDelta(repo.delta7d)} this week){stripWhy(repo.oneLiner) ? `: ${stripWhy(repo.oneLiner)}` : "."}
      </p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Below are {alts.length} other {cat} repos tracked by {SITE.name} that share at least two GitHub topics with {repo.name}, ordered by how many topics overlap,
        then by stars gained in the last 7 days. Topic overlap means a similar problem space, not a drop-in replacement, so check each project&apos;s README.
      </p>
      <ol className="mt-6 space-y-3">
        {alts.map((a, i) => (
          <li key={a.repo.fullName} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 break-words font-semibold">
                {i + 1}. <Link className="hover:underline" href={repoPath(a.repo)}>{a.repo.fullName}</Link>
              </h2>
              <span className="shrink-0 font-mono text-sm text-emerald-700 dark:text-emerald-400">
                {formatDelta(a.repo.delta7d)}/wk{a.repo.estimated7d && <EstBadge />}
              </span>
            </div>
            {stripWhy(a.repo.oneLiner) && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{stripWhy(a.repo.oneLiner)}</p>}
            <p className="mt-2 text-xs text-zinc-500">
              {formatNumber(a.repo.stars)} stars{a.repo.language ? ` · ${a.repo.language}` : ""} · shared topics: {a.sharedTopics.join(", ")}
              {hasAlternativesPage(a.repo) && (
                <>
                  {" · "}
                  <Link className="underline" href={alternativesPath(a.repo)}>{a.repo.name} alternatives</Link>
                </>
              )}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        More: <Link className="underline" href={`/category/${repo.category}`}>all trending {cat} repos</Link> ·{" "}
        <Link className="underline" href={`/compare?r=${[repo, ...alts.slice(0, 2).map((a) => a.repo)].map((r) => r.fullName).join(",")}`}>compare {repo.name} with the top 2</Link> ·{" "}
        <Link className="underline" href="/alternatives">alternatives to other trending repos</Link>
      </p>
    </article>
  );
}
