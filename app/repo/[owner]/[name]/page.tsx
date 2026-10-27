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
import { breadcrumbLd, clipWidth, textWidth, repoPageTitle, repoPath, websiteRef, pageAlternates, pageNodeIds, ogDefaults } from "@/lib/seo";
import type { Repo } from "@/lib/types";
import { getDetails } from "@/lib/details";
import { stripWhy } from "@/lib/blurb";
import { getHourlyStars } from "@/lib/hourly";
import { getDailyAppearances } from "@/lib/daily";
import { getHnMentions } from "@/lib/mentions";
import { hasTopicPage, repoTopics, topicLabel } from "@/lib/topics";
import { isThinRepo } from "@/lib/thin";
import { badgeSpec } from "@/lib/badge";
import { altLabel, alternativesPath, hasAlternativesPage } from "@/lib/alternatives";
import { ago, getLatestRelease, releaseVersion } from "@/lib/activity";
import { HnMentions } from "@/components/HnMentions";
import { StarChart } from "@/components/StarChart";
import { getLanguage, languageSlug } from "@/lib/languages";
import { RepoDetailsView } from "@/components/RepoDetailsView";
import { InlineSignup } from "@/components/InlineSignup";
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

// Abbreviations whose trailing dot is not a sentence end ("Matrix e.g. Integrated with …").
const ABBREV_END = /(?:^|[\s(])(?:e\.g|i\.e|etc|vs|incl|approx|cf|ca|al)\.$/i;

/**
 * Leading whole sentences, contiguous from the start of the text. A sentence ends at . ! ? 。 followed by
 * whitespace or the end, never inside "draw.io", "llama.cpp" or after "e.g.". The old regex matched sentences
 * anywhere, so when the first one had no clean end it skipped ahead and led with fragments like "g." or "io diagrams".
 */
function leadingSentences(t: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (const m of t.matchAll(/[.!?。]+(?=\s|$)|。/g)) {
    const end = m.index + m[0].length;
    const sentence = t.slice(start, end).trim();
    if (ABBREV_END.test(sentence)) continue;
    if (sentence) out.push(sentence);
    start = end;
  }
  return out;
}

/** Whole leading sentences that fit in `room`; otherwise a word-clip (with …) of the start. Drops the template's generic "Why it matters" line. */
function metaLead(text: string, room: number): string {
  // Measured in rendered width (CJK counts double) so long Chinese descriptions don't crowd the stats out of the snippet.
  const t = stripWhy(text.replace(/\s+/g, " ").trim());
  if (textWidth(t) <= room) return t;
  let out = "";
  for (const sentence of leadingSentences(t)) {
    const next = `${out} ${sentence}`.trim();
    if (textWidth(next) > room) break;
    out = next;
  }
  return out || clipWidth(t, room).replace(/[\s,;:(\-–—/]+…$/, "…");
}

/**
 * Short GitHub descriptions ("Build resilient agents.") leave repo metas at ~90 chars, mostly boilerplate.
 * Fill the spare room with real facts from the page (language, age, forks, latest release), inserted before
 * the "tracked by" sentence, longest first that still fits in 155 (shorter variants drop the language).
 */
function withFacts(base: string, repo: Repo): string {
  const MAX = 155;
  if (textWidth(base) >= 125) return base;
  const release = getLatestRelease(repo.fullName);
  const what = repo.language ? `${/^[AEIOU]/i.test(repo.language) ? "An" : "A"} ${repo.language} project` : "A project";
  const made = `${what} created ${ageText(repo.createdAt)} ago`;
  const rel = release?.tag && release.tag.length <= 20 ? ` Latest release ${release.tag}.` : "";
  const forks = ` with ${formatNumber(repo.forks)} forks`;
  const cut = base.lastIndexOf(` ${trackedLabel(repo)} repo tracked by`);
  if (cut < 0) return base;
  // Shorter fallbacks (no language phrase) so long language names like "Jupyter Notebook" still leave room for a fact.
  const age = `Created ${ageText(repo.createdAt)} ago`;
  const variants = [`${made}${forks}.${rel}`, `${made}${forks}.`, `${made}.${rel}`, `${made}.`, `${age}${forks}.`, `${age}.`, `${formatNumber(repo.forks)} forks.`];
  for (const facts of variants) {
    const out = `${base.slice(0, cut)} ${facts}${base.slice(cut)}`;
    if (textWidth(out) <= MAX) return out;
  }
  return base;
}

/** "MCP repo tracked by OSS Radar"; uncategorized repos read "Open-source repo" rather than the awkward "Other repo". */
function trackedLabel(repo: Repo): string {
  return repo.category === "other" ? "Open-source" : categoryLabel(repo.category);
}

/** Meta description for a repo page; shared by the page metadata and its WebPage JSON-LD so they can't drift. */
function repoMetaDescription(repo: Repo): string {
  // Stats always survive: clip the (English-preferred) one-liner to whatever room the stats line leaves.
  const stats = `${formatNumber(repo.stars)} stars, ${formatDelta(repo.delta7d)} in 7 days. ${trackedLabel(repo)} repo tracked by ${SITE.name}.`;
  const lead = metaLead(repo.oneLiner || repo.description || "", 155 - stats.length);
  const base = lead ? `${/[.!?…。]$/.test(lead) ? lead : `${lead}.`} ${stats}` : stats;
  return withFacts(base, repo);
}

export async function generateMetadata({ params }: PageProps<"/repo/[owner]/[name]">): Promise<Metadata> {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo) return {};
  // <title> stays short (Google cuts around 60 chars); the fuller growth phrase
  // lives in the OG/X title, where length matters less — same pattern as category hubs.
  const title = repoPageTitle(repo);
  const socialTitle = `${repo.fullName}: GitHub stars growth (${formatDelta(repo.delta7d)} this week)`;
  const description = repoMetaDescription(repo);
  const url = repoPath(repo);
  return {
    title,
    description,
    alternates: pageAlternates(url),
    ...(isThinRepo(repo) ? { robots: { index: false, follow: true } } : {}),
    openGraph: { siteName: ogDefaults.siteName, locale: ogDefaults.locale, type: "article", title: socialTitle, description, url },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  };
}

function RepoCards({ repos }: { repos: Repo[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {repos.map((s) => (
        <li key={s.fullName} className="relative cursor-pointer rounded-lg border border-zinc-200 p-3 transition-colors hover:border-indigo-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-indigo-700 dark:hover:bg-zinc-900/60">
          <div className="flex items-start justify-between gap-2">
            <Link href={repoPath(s)} className="min-w-0 break-words font-medium hover:underline after:absolute after:inset-0 after:content-['']">
              {s.fullName}
            </Link>
            <span className="shrink-0 font-mono text-sm text-emerald-700 dark:text-emerald-400">
              {formatDelta(s.delta7d)}
              {s.estimated7d && <EstBadge />}
              <span className="sr-only"> stars this week</span>
            </span>
          </div>
          {stripWhy(s.oneLiner) && <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{stripWhy(s.oneLiner)}</p>}
        </li>
      ))}
    </ul>
  );
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
  const related = similar.slice(0, 4);
  const shown = new Set([repo.fullName, ...related.map((r) => r.fullName)]);
  const risingInCat = rankRepos(getReposByCategory(repo.category), "week").filter((r) => !shown.has(r.fullName)).slice(0, 6);
  const todayList = rankRepos(getRepos(), "today");
  const todayIdx = todayList.findIndex((r) => r.fullName === repo.fullName);
  const todayRank = todayIdx + 1;
  const prev = todayIdx > 0 ? todayList[todayIdx - 1] : null;
  const next = todayIdx >= 0 && todayIdx < todayList.length - 1 ? todayList[todayIdx + 1] : null;
  const hourlyPts = getHourlyStars(repo.fullName);
  const hn = getHnMentions(repo.fullName);
  const release = getLatestRelease(repo.fullName);
  const nowMs = Date.parse(getData().generatedAt);
  const details = getDetails(repo.fullName);
  const daily = getDailyAppearances(repo.fullName);
  const software = {
    "@type": "SoftwareSourceCode",
    name: repo.name,
    alternateName: repo.fullName,
    url: repo.url,
    description: repo.description || repo.oneLiner,
    codeRepository: repo.url,
    sameAs: repo.url,
    isAccessibleForFree: true,
    // Who-it's-for lives here rather than in a separate SoftwareApplication node: Google treats
    // SoftwareApplication as a rich-result type that requires aggregateRating/review, which we
    // don't have, so every repo page was reporting an invalid Software App item.
    audience: details?.whoItsFor ? { "@type": "Audience", audienceType: details.whoItsFor } : undefined,
    programmingLanguage: repo.language ?? undefined,
    author: {
      "@type": (repo.ownerType ?? "User") === "Organization" ? "Organization" : "Person",
      name: repo.owner,
      url: `https://github.com/${repo.owner}`,
    },
    dateCreated: repo.createdAt,
    dateModified: repo.pushedAt,
    keywords: repo.topics.join(", ") || undefined,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: repo.stars,
    },
    softwareVersion: releaseVersion(release?.tag, repo.name),
    license: repo.license?.spdx ? `https://spdx.org/licenses/${repo.license.spdx}.html` : undefined,
  };
  // The page itself (an OSS Radar profile of the repo, rebuilt hourly) is a separate thing from the
  // repo it describes: say so, with when its numbers were last refreshed and the card it shares.
  const pagePath = repoPath(repo);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    ...pageNodeIds(pagePath),
    name: repoPageTitle(repo),
    description: repoMetaDescription(repo),
    url: `${SITE.url}${pagePath}`,
    dateModified: getData().generatedAt,
    inLanguage: "en",
    isPartOf: websiteRef,
    primaryImageOfPage: { "@type": "ImageObject", url: `${SITE.url}${pagePath}/opengraph-image`, width: 1200, height: 630 },
    mainEntity: software,
  };
  const crumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Categories", path: "/category" },
    { name: categoryLabel(repo.category), path: `/category/${repo.category}` },
    { name: repo.fullName, path: repoPath(repo) },
  ]);

  return (
    <article className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <JsonLd data={jsonLd} />
      <JsonLd data={crumbs} />
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <BackButton fallbackHref="/" />
          <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-zinc-500">
            <Link href="/" className="hover:underline">Home</Link> /{" "}<Link href="/category" className="hover:underline">Categories</Link> /{" "}<Link href={`/category/${repo.category}`} className="hover:underline">{categoryLabel(repo.category)}</Link> /{" "}<span className="break-all text-zinc-700 dark:text-zinc-300">{repo.fullName}</span>
          </nav>
        </div>
        <header className="flex items-center gap-3">
          <Image
            src={`${repo.ownerAvatar}${repo.ownerAvatar.includes("?") ? "&" : "?"}s=96`}
            alt={`${repo.owner} avatar`}
            loading="eager"
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

        {related.length > 0 && (
          <section className="mt-6">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold">Related repos</h2>
              {hasAlternativesPage(repo) && (
                <Link className="text-xs text-indigo-700 hover:underline dark:text-indigo-400" href={alternativesPath(repo)}>All {altLabel(repo)} alternatives →</Link>
              )}
            </div>
            <RepoCards repos={related} />
          </section>
        )}

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

        <InlineSignup source="repo" className="mt-8" />

        {hn && <HnMentions m={hn} fullName={repo.fullName} />}

        <BadgeEmbed owner={repo.owner} name={repo.name} siteUrl={SITE.url} width={badgeSpec(repo).width} />

        <section className="mt-6">
          <h2 className="mb-3 text-xl font-semibold tracking-tight">About {repo.name}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{aboutText(repo)}</p>
          {daily.length > 0 && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              It made the {SITE.name} daily top 25 on {daily.length} {daily.length === 1 ? "day" : "days"}
              {daily.length > 5 ? " (latest 5 shown)" : ""}:{" "}
              {daily.slice(0, 5).map((a, i, shown) => (
                <span key={a.date}>
                  #{a.rank} on <Link className="underline" href={`/daily/${a.date}`}>{formatDate(a.date)}</Link> ({formatDelta(a.gained)} stars)
                  {i < shown.length - 1 ? "; " : "."}
                </span>
              ))}{" "}
              Browse the full <Link className="underline" href="/daily">daily archive</Link>.
            </p>
          )}
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            See more <Link className="underline" href={`/category/${repo.category}`}>trending {categoryLabel(repo.category)} repos</Link> or the{" "}
            <Link className="underline" href="/trending/ai-repos-this-week">top AI repos this week</Link>.
            {hasAlternativesPage(repo) && (
              <> Looking for something similar? See <Link className="underline" href={alternativesPath(repo)}>{altLabel(repo)} alternatives</Link>.</>
            )}
          </p>
        </section>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div><dt className="text-zinc-500">Language</dt><dd>{repo.language && getLanguage(languageSlug(repo.language)) ? <Link className="underline" href={`/language/${languageSlug(repo.language)}`}>{repo.language}</Link> : (repo.language ?? "n/a")}</dd></div>
          <div><dt className="text-zinc-500">Category</dt><dd><Link className="hover:underline" href={`/category/${repo.category}`}>{categoryLabel(repo.category)}</Link></dd></div>
          {repo.license !== undefined && (
            <div>
              <dt className="text-zinc-500" title="The license GitHub detected in the repo">License</dt>
              <dd>
                {repo.license?.spdx ? (
                  <a className="underline" href={`https://spdx.org/licenses/${repo.license.spdx}.html`} rel="noopener" title={repo.license.name}>{repo.license.spdx}</a>
                ) : (
                  <span className="text-zinc-500">{repo.license ? repo.license.name : "None detected"}</span>
                )}
              </dd>
            </div>
          )}
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
            {repoTopics(repo).map((t) => (
              <li key={t}>
                {hasTopicPage(t) ? (
                  <Link href={`/topic/${t}`} className="block rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-950">{topicLabel(t)}</Link>
                ) : (
                  <span className="block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">{topicLabel(t)}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {risingInCat.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">
              Rising in <Link className="hover:underline" href={`/category/${repo.category}`}>{categoryLabel(repo.category)}</Link> this week
            </h2>
            <RepoCards repos={risingInCat} />
          </section>
        )}

        <nav aria-label="Leaderboard rank navigation" className="mt-10 grid grid-cols-2 gap-3 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800">
          {prev ? (
            <Link href={repoPath(prev)} className="min-w-0 rounded-lg border border-zinc-200 p-3 hover:border-indigo-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-indigo-700 dark:hover:bg-zinc-900/60">
              <span className="block text-xs text-zinc-500">← #{todayRank - 1} today</span>
              <span className="block truncate font-medium">{prev.fullName}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={repoPath(next)} className="min-w-0 rounded-lg border border-zinc-200 p-3 text-right hover:border-indigo-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-indigo-700 dark:hover:bg-zinc-900/60">
              <span className="block text-xs text-zinc-500">#{todayRank + 1} today →</span>
              <span className="block truncate font-medium">{next.fullName}</span>
            </Link>
          ) : <span />}
        </nav>
        <p className="mt-2 text-center text-xs text-zinc-500">
          {repo.fullName} is #{todayRank} of {todayList.length} on today&apos;s <Link className="underline" href="/#leaderboard">leaderboard</Link>.
        </p>
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
