import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EstBadge, EstimateNote } from "@/components/EstBadge";
import { Sparkline } from "@/components/Sparkline";
import { SponsorSlot } from "@/components/SponsorSlot";
import { categoryLabel } from "@/lib/categories";
import { getRepo, getRepos, getSimilarRepos } from "@/lib/data";
import { formatDate, formatDelta, formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { getData, getReposByCategory, rankRepos } from "@/lib/data";
import { breadcrumbLd, clip, repoPath } from "@/lib/seo";
import type { Repo } from "@/lib/types";

function ageText(iso: string): string {
  const d = Math.max(0, Math.round((new Date(getData().generatedAt).getTime() - new Date(iso).getTime()) / 86_400_000));
  if (d < 1) return "less than a day";
  if (d < 60) return `${d} day${d === 1 ? "" : "s"}`;
  if (d < 730) return `${Math.round(d / 30)} months`;
  return `${Math.round(d / 365)} years`;
}

function categoryRank(repo: Repo) {
  const ranked = rankRepos(getReposByCategory(repo.category), "week");
  return { rank: ranked.findIndex((r) => r.fullName === repo.fullName) + 1, total: ranked.length };
}

function aboutText(repo: Repo): string {
  const { rank, total } = categoryRank(repo);
  const cat = categoryLabel(repo.category);
  const lang = repo.language ? `a ${repo.language} project` : "a project";
  const est = repo.velocityEstimated ? " (early estimate)" : "";
  return `${repo.fullName} is ${lang} in the ${cat} category, created ${ageText(repo.createdAt)} ago. It has ${formatNumber(repo.stars)} GitHub stars and ${formatNumber(repo.forks)} forks, and gained ${formatDelta(repo.delta7d)} stars over the last 7 days${est}, ranking #${rank} of ${total} ${cat} repos tracked by ${SITE.name} this week.`;
}

export function generateStaticParams() {
  return getRepos().map((r) => ({ owner: r.owner, name: r.name }));
}

export async function generateMetadata({ params }: PageProps<"/repo/[owner]/[name]">): Promise<Metadata> {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo) return {};
  const title = `${repo.fullName}: ${formatDelta(repo.delta7d)} GitHub stars this week`;
  const description = clip(
    `${repo.description || repo.oneLiner} ${formatNumber(repo.stars)} stars, ${formatDelta(repo.delta7d)} in 7 days. ${categoryLabel(repo.category)} repo tracked by ${SITE.name}.`,
  );
  const url = repoPath(repo);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Stat({ label, value, est }: { label: string; value: string; est?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold">
        {value}
        {est && <EstBadge />}
      </p>
    </div>
  );
}

export default async function RepoPage({ params }: PageProps<"/repo/[owner]/[name]">) {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo) notFound();
  const similar = getSimilarRepos(repo);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: repo.name,
    alternateName: repo.fullName,
    url: `${SITE.url}${repoPath(repo)}`,
    description: repo.description || repo.oneLiner,
    codeRepository: repo.url,
    programmingLanguage: repo.language ?? undefined,
    author: { "@type": "Person", name: repo.owner, url: `https://github.com/${repo.owner}` },
    dateCreated: repo.createdAt,
    dateModified: repo.pushedAt,
    keywords: repo.topics.join(", ") || undefined,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: repo.stars,
    },
  };
  const crumbs = breadcrumbLd([
    { name: "Leaderboard", path: "/" },
    { name: categoryLabel(repo.category), path: `/category/${repo.category}` },
    { name: repo.fullName, path: repoPath(repo) },
  ]);

  return (
    <article className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <JsonLd data={jsonLd} />
      <JsonLd data={crumbs} />
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-500">
          <Link href="/" className="hover:underline">Leaderboard</Link> /{" "}
          <Link href={`/category/${repo.category}`} className="hover:underline">{categoryLabel(repo.category)}</Link>
        </nav>
        <header className="flex items-center gap-3">
          <Image
            src={`${repo.ownerAvatar}${repo.ownerAvatar.includes("?") ? "&" : "?"}s=96`}
            alt={`${repo.owner} avatar`}
            width={48}
            height={48}
            unoptimized
            className="rounded-full"
          />
          <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-zinc-500 dark:text-zinc-400">{repo.owner}/</span>
            {repo.name}
          </h1>
        </header>

        <p className="mt-4 text-lg">{repo.oneLiner}</p>
        {repo.description && repo.description !== repo.oneLiner && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-medium">GitHub description:</span> {repo.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a href={repo.url} className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300" rel="noopener">
            View on GitHub
          </a>
          {repo.homepage && (
            <a href={repo.homepage} className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900" rel="noopener nofollow">
              Website
            </a>
          )}
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Stars" value={formatNumber(repo.stars)} />
          <Stat label="Last 24h" value={formatDelta(repo.delta24h)} est={repo.estimated24h} />
          <Stat label="Last 7 days" value={formatDelta(repo.delta7d)} est={repo.estimated7d} />
          <Stat label="Forks" value={formatNumber(repo.forks)} />
        </section>

        <section className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 text-sm font-semibold">Star history (last {repo.history.length} snapshot{repo.history.length === 1 ? "" : "s"})</h2>
          <Sparkline points={repo.history} width={640} height={120} className="h-auto w-full text-indigo-500" title={`Star history for ${repo.fullName}`} />
          {repo.history.length < 2 ? (
            <p className="mt-2 text-xs text-zinc-500">
              Only one snapshot so far. The chart fills in as OSS Radar collects daily data.
            </p>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">
              {formatNumber(repo.history[0].stars)} → {formatNumber(repo.stars)} stars from {formatDate(repo.history[0].date)} to{" "}
              {formatDate(repo.history[repo.history.length - 1].date)}
            </p>
          )}
        </section>

        {repo.velocityEstimated && <EstimateNote className="mt-4" />}

        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">About {repo.name}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{aboutText(repo)}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            See more <Link className="underline" href={`/category/${repo.category}`}>trending {categoryLabel(repo.category)} repos</Link> or the{" "}
            <Link className="underline" href="/trending/ai-repos-this-week">top AI repos this week</Link>.
          </p>
        </section>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div><dt className="text-zinc-500">Language</dt><dd>{repo.language ?? "n/a"}</dd></div>
          <div><dt className="text-zinc-500">Category</dt><dd><Link className="hover:underline" href={`/category/${repo.category}`}>{categoryLabel(repo.category)}</Link></dd></div>
          <div><dt className="text-zinc-500">Created</dt><dd>{formatDate(repo.createdAt)}</dd></div>
          <div><dt className="text-zinc-500">Last push</dt><dd>{formatDate(repo.pushedAt)}</dd></div>
        </dl>

        {repo.topics.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-1.5">
            {repo.topics.map((t) => (
              <li key={t} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                {t}
              </li>
            ))}
          </ul>
        )}

        {similar.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">Similar rising repos</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {similar.map((s) => (
                <li key={s.fullName} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/repo/${s.owner}/${s.name}`} className="min-w-0 break-words font-medium hover:underline">
                      {s.fullName}
                    </Link>
                    <span className="shrink-0 font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {formatDelta(s.delta7d)}
                      {s.estimated7d && <EstBadge />}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{s.oneLiner}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <aside className="space-y-4">
        <SponsorSlot variant="card" />
        <p className="text-xs text-zinc-500">
          Numbers from the GitHub API as of {formatDate(repo.history[repo.history.length - 1]?.date ?? repo.pushedAt)}.
          Spotted something wrong? <a className="underline" href={`${SITE.github}`}>Let us know</a>.
        </p>
      </aside>
    </article>
  );
}
