import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/BackNav";
import { notFound } from "next/navigation";
import { EstBadge, EstimateNote } from "@/components/EstBadge";
import { SponsorSlot } from "@/components/SponsorSlot";
import { WatchButton } from "@/components/WatchButton";
import { BadgeEmbed } from "@/components/BadgeEmbed";
import { categoryLabel } from "@/lib/categories";
import { getRepo, getRepos, getSimilarRepos } from "@/lib/data";
import { formatDate, formatDelta, formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { getData, getReposByCategory, rankRepos } from "@/lib/data";
import { breadcrumbLd, clip, repoPath } from "@/lib/seo";
import type { Repo } from "@/lib/types";
import { getDetails } from "@/lib/details";
import { getHourlyStars } from "@/lib/hourly";
import { getHnMentions } from "@/lib/mentions";
import { hasTopicPage } from "@/lib/topics";
import { ago, getLatestRelease } from "@/lib/activity";
import { HnMentions } from "@/components/HnMentions";
import { StarChart } from "@/components/StarChart";
import { getLanguage, languageSlug } from "@/lib/languages";
import { RepoDetailsView } from "@/components/RepoDetailsView";
import { ShareButton } from "@/components/ShareButton";

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
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
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
  const hourlyPts = getHourlyStars(repo.fullName);
  const hn = getHnMentions(repo.fullName);
  const release = getLatestRelease(repo.fullName);
  const nowMs = Date.parse(getData().generatedAt);
  const details = getDetails(repo.fullName);
  const appLd = details && {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: repo.name,
    url: `${SITE.url}${repoPath(repo)}`,
    sameAs: repo.url,
    description: details.whoItsFor ?? repo.description ?? repo.oneLiner,
    applicationCategory: "DeveloperApplication",
    featureList: details.useCases.length ? details.useCases : undefined,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

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
      {appLd && <JsonLd data={appLd} />}
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <BackButton fallbackHref="/" />
          <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-zinc-500">
            <Link href="/" className="hover:underline">Home</Link> /{" "}<Link href={`/category/${repo.category}`} className="hover:underline">{categoryLabel(repo.category)}</Link> /{" "}<span className="break-all text-zinc-700 dark:text-zinc-300">{repo.name}</span>
          </nav>
        </div>
        <header className="flex items-center gap-3">
          <Image
            src={`${repo.ownerAvatar}${repo.ownerAvatar.includes("?") ? "&" : "?"}s=96`}
            alt={`${repo.owner} avatar`}
            width={48}
            height={48}
            unoptimized
            className="shrink-0 rounded-full"
          />
          <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
            <span className="text-zinc-500 dark:text-zinc-400">{repo.owner}/</span>
            {repo.name}
          </h1>
        </header>

        <p className="mt-4 text-lg">{repo.oneLiner}</p>
        {repo.description && repo.description !== repo.oneLiner && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-medium">GitHub description:</span> {repo.description.replace(/\s+/g, " ").trim()}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a href={repo.url} className="inline-flex h-9 items-center rounded-md bg-zinc-900 px-3.5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300" rel="noopener">
            View on GitHub
          </a>
          {repo.homepage && (
            <a href={repo.homepage} className="inline-flex h-9 items-center rounded-md border border-zinc-300 px-3.5 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900" rel="noopener nofollow">
              Website
            </a>
          )}
          <WatchButton fullName={repo.fullName} withLabel />
          <ShareButton path={repoPath(repo)} title={repo.fullName} className="h-9 px-3.5 text-sm" />
          <Link
            href={`/compare?r=${[repo, ...similar.slice(0, 1)].map((r) => r.fullName).join(",")}`}
            className="inline-flex h-9 items-center rounded-md border border-zinc-300 px-3.5 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Compare
          </Link>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Stars" value={formatNumber(repo.stars)} />
          <Stat label="Last 24h" value={formatDelta(repo.delta24h)} est={repo.estimated24h} />
          <Stat label="Last 7 days" value={formatDelta(repo.delta7d)} est={repo.estimated7d} />
          <Stat label="Forks" value={formatNumber(repo.forks)} />
        </section>

        {details && <RepoDetailsView d={details} />}

        <section className="mt-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-semibold">Star history</h2>
          <p className="mb-3 text-xs text-zinc-500">GitHub stars over time. A steeper line means the repo is gaining attention faster.</p>
          {hourlyPts.length >= 2 && (
            <>
              <h3 className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Last {hourlyPts.length} hours · +{formatNumber(hourlyPts[hourlyPts.length - 1].stars - hourlyPts[0].stars)} stars</h3>
              <StarChart
                points={hourlyPts.map((p) => ({ x: p.t, stars: p.stars }))}
                label={(t) => new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", timeZone: "UTC" }) + " UTC"}
                title={`Hourly star count for ${repo.fullName}`}
              />
            </>
          )}
          {repo.history.length >= 2 && (
            <div className={hourlyPts.length >= 2 ? "mt-5" : ""}>
              <h3 className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Daily, since {formatDate(repo.history[0].date)} · {formatNumber(repo.history[0].stars)} → {formatNumber(repo.stars)}</h3>
              <StarChart points={repo.history.map((p) => ({ x: p.date, stars: p.stars }))} label={(d) => formatDate(d)} title={`Daily star count for ${repo.fullName}`} />
            </div>
          )}
          {hourlyPts.length < 2 && repo.history.length < 2 && (
            <p className="text-xs text-zinc-500">Not enough history yet. OSS Radar records stars every hour, so this chart fills in over the next few hours.</p>
          )}
        </section>

        {repo.velocityEstimated && <EstimateNote className="mt-4" />}

        {hn && <HnMentions m={hn} fullName={repo.fullName} />}

        <BadgeEmbed owner={repo.owner} name={repo.name} siteUrl={SITE.url} />

        <section className="mt-6">
          <h2 className="mb-3 text-xl font-semibold tracking-tight">About {repo.name}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{aboutText(repo)}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            See more <Link className="underline" href={`/category/${repo.category}`}>trending {categoryLabel(repo.category)} repos</Link> or the{" "}
            <Link className="underline" href="/trending/ai-repos-this-week">top AI repos this week</Link>.
          </p>
        </section>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div><dt className="text-zinc-500">Language</dt><dd>{repo.language && getLanguage(languageSlug(repo.language)) ? <Link className="underline" href={`/language/${languageSlug(repo.language)}`}>{repo.language}</Link> : (repo.language ?? "n/a")}</dd></div>
          <div><dt className="text-zinc-500">Category</dt><dd><Link className="hover:underline" href={`/category/${repo.category}`}>{categoryLabel(repo.category)}</Link></dd></div>
          <div><dt className="text-zinc-500">Created</dt><dd>{formatDate(repo.createdAt)}</dd></div>
          <div>
            <dt className="text-zinc-500" title="When code was last pushed (uploaded) to the repo">Last code push</dt>
            <dd>{ago(repo.pushedAt, nowMs)} <span className="text-zinc-500">({formatDate(repo.pushedAt)})</span></dd>
          </div>
          {release !== undefined && (
            <div>
              <dt className="text-zinc-500" title="A release is a packaged, versioned snapshot the maintainers publish">Latest release</dt>
              <dd>
                {release ? (
                  <><a className="underline" href={release.url} rel="noopener">{release.tag}</a> <span className="text-zinc-500">{ago(release.date, nowMs)}</span></>
                ) : (
                  <span className="text-zinc-500">No releases yet</span>
                )}
              </dd>
            </div>
          )}
        </dl>

        {repo.topics.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-1.5">
            {repo.topics.map((t) => (
              <li key={t}>
                {hasTopicPage(t) ? (
                  <Link href={`/topic/${t}`} className="block rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-950">{t}</Link>
                ) : (
                  <span className="block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">{t}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {similar.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">Similar rising repos</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {similar.map((s) => (
                <li key={s.fullName} className="relative cursor-pointer rounded-lg border border-zinc-200 p-3 transition-colors hover:border-indigo-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-indigo-700 dark:hover:bg-zinc-900/60">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/repo/${s.owner}/${s.name}`} className="min-w-0 break-words font-medium hover:underline after:absolute after:inset-0 after:content-['']">
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
