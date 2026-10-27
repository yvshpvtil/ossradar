import type { Metadata } from "next";
import { PageNav } from "@/components/PageNav";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { EstBadge } from "@/components/EstBadge";
import { altLabel, alternativesPath, getAlternatives, getAlternativesRepos, getCategoryNeighbors, getRepo, hasAlternativesPage } from "@/lib/alternatives";
import { categoryLabel } from "@/lib/categories";
import { formatDelta, formatNumber } from "@/lib/format";
import { stripWhy } from "@/lib/why";
import { abs, alternativesPageTitle, breadcrumbLd, clip, collectionPageLd, repoPath, ogDefaults, pageAlternates } from "@/lib/seo";
import { getData } from "@/lib/data";
import { canonicalTopic, getTopics, repoTopics, topicHref, topicLabel } from "@/lib/topics";
import type { Repo } from "@/lib/types";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return getAlternativesRepos().map((r) => ({ owner: r.owner, name: r.name }));
}

/** Title and description shared by the page metadata and its CollectionPage JSON-LD, so they can't drift. */
function alternativesMeta(repo: Repo) {
  const alts = getAlternatives(repo);
  return {
    title: alternativesPageTitle(altLabel(repo), alts.length),
    description: alternativesDescription(repo, alts.map((a) => a.repo.fullName)),
  };
}

/**
 * Names as many alternatives as fit in a search snippet instead of clipping the sentence
 * mid-word: tries 3, 2, then 1 named alternatives, each with the full and then the short
 * ranking tail, and keeps the first variant under `max`.
 */
function alternativesDescription(repo: Repo, names: string[], max = 155): string {
  const cat = categoryLabel(repo.category);
  const tails = [`${cat} repos sharing its GitHub topics, ranked by stars gained this week.`, "Ranked by stars gained this week.", ""];
  for (let k = Math.min(3, names.length); k >= 1; k--) {
    const rest = names.length - k;
    const lead = `Open-source alternatives to ${repo.fullName}: ${names.slice(0, k).join(", ")}${rest > 0 ? ` and ${rest} more` : ""}.`;
    for (const t of tails) {
      const v = `${lead} ${t}`.trim();
      if (v.length <= max) return v;
    }
  }
  return clip(`Open-source alternatives to ${repo.fullName}, ranked by stars gained this week.`, max);
}

export async function generateMetadata({ params }: PageProps<"/alternatives/[owner]/[name]">): Promise<Metadata> {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo || !hasAlternativesPage(repo)) return {};
  const alts = getAlternatives(repo);
  const { title, description } = alternativesMeta(repo);
  const shareTitle = `${alts.length} open-source ${altLabel(repo)} alternatives on GitHub`;
  const url = alternativesPath(repo);
  return { title, description, alternates: pageAlternates(url), openGraph: { siteName: ogDefaults.siteName, locale: ogDefaults.locale, type: ogDefaults.type, title: shareTitle, description, url }, twitter: { card: "summary_large_image", title: shareTitle, description } };
}

export default async function AlternativesPage({ params }: PageProps<"/alternatives/[owner]/[name]">) {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo || !hasAlternativesPage(repo)) notFound();
  const alts = getAlternatives(repo);
  const neighbors = getCategoryNeighbors(repo, alts);
  const path = alternativesPath(repo);
  const cat = categoryLabel(repo.category);
  // Topic hubs (topics used by enough tracked repos) this page can link to, so shared topics lead somewhere.
  const hubs = new Set(getTopics().map((t) => t.slug));
  const repoHubs = repoTopics(repo).filter((t) => hubs.has(t)).slice(0, 4);
  const topicChips = (raw: string[]) => {
    const slugs = [...new Set(raw.map(canonicalTopic))];
    return slugs.map((t, i) => (
      <span key={t}>
        {i > 0 && ", "}
        {topicHref(t) ? <Link className="underline" href={topicHref(t)!}>{topicLabel(t)}</Link> : topicLabel(t)}
      </span>
    ));
  };
  return (
    <article className="max-w-3xl">
      <JsonLd
        data={{
          ...collectionPageLd({
            name: alternativesMeta(repo).title,
            description: alternativesMeta(repo).description,
            path,
            dateModified: getData().generatedAt,
            ogCard: true,
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
      <h1 className="text-3xl font-bold tracking-tight">{altLabel(repo)} alternatives</h1>
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
              {formatNumber(a.repo.stars)} stars{a.repo.language ? ` · ${a.repo.language}` : ""} · shared topics: {topicChips(a.sharedTopics)}
              {hasAlternativesPage(a.repo) && (
                <>
                  {" · "}
                  <Link className="underline" href={alternativesPath(a.repo)}>{altLabel(a.repo)} alternatives</Link>
                </>
              )}
            </p>
          </li>
        ))}
      </ol>
      {neighbors.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">More rising {cat} repos</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Only {alts.length} tracked repos share at least two GitHub topics with {repo.name}, so here are the {cat} repos gaining the most stars this week.
            They sit in the same category but don&apos;t share its topics, so treat them as related projects rather than alternatives.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {neighbors.map((r) => (
              <li key={r.fullName}>
                <Link className="font-medium hover:underline" href={repoPath(r)}>{r.fullName}</Link>{" "}
                <span className="font-mono text-emerald-700 dark:text-emerald-400">{formatDelta(r.delta7d)}/wk</span>
                {stripWhy(r.oneLiner) && <span className="text-zinc-600 dark:text-zinc-400">: {stripWhy(r.oneLiner)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        More: <Link className="underline" href={`/category/${repo.category}`}>all trending {cat} repos</Link> ·{" "}
        {repoHubs.map((t) => (
          <span key={t}>
            <Link className="underline" href={`/topic/${t}`}>trending {topicLabel(t)} repos</Link> ·{" "}
          </span>
        ))}
        <Link className="underline" href={`/compare?r=${[repo, ...alts.slice(0, 2).map((a) => a.repo)].map((r) => r.fullName).join(",")}`}>compare {repo.name} with the top 2</Link> ·{" "}
        <Link className="underline" href="/alternatives">alternatives to other trending repos</Link>
      </p>
    </article>
  );
}
