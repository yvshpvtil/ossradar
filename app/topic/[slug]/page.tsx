import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/BackNav";
import { notFound } from "next/navigation";
import { EstimateNote } from "@/components/EstBadge";
import { Leaderboard } from "@/components/Leaderboard";
import { HubIndex } from "@/components/HubIndex";
import { JsonLd } from "@/components/JsonLd";
import { rankRepos } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { toLeaderRepo } from "@/lib/leader";
import { breadcrumbLd, clip, itemListLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { getReposByTopic, getTopics, hasTopicPage, repoTopics, topicLabel, topicVariants } from "@/lib/topics";

export function generateStaticParams() {
  return getTopics().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/topic/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!hasTopicPage(slug)) return {};
  const n = getReposByTopic(slug).length;
  const label = topicLabel(slug);
  // <title> stays short (Google cuts around 60 chars); the live count lives in the
  // description and in the OG/X title, where length matters less.
  const title = `Trending ${label} GitHub repos`;
  const socialTitle = `${title}: ${n} rising projects`;
  const description = clip(`The fastest-rising open-source ${label} repos on GitHub, ranked by stars gained. ${n} tracked, updated hourly on ${SITE.name}.`);
  return { title, description, alternates: { canonical: `/topic/${slug}` }, openGraph: { title: socialTitle, description, url: `/topic/${slug}` }, twitter: { card: "summary_large_image", title: socialTitle, description } };
}

export default async function TopicPage({ params }: PageProps<"/topic/[slug]">) {
  const { slug } = await params;
  if (!hasTopicPage(slug)) notFound();
  const repos = getReposByTopic(slug);
  const label = topicLabel(slug);
  const ranked = rankRepos(repos, "week");
  const top = ranked.slice(0, 3);
  const weekTotal = repos.reduce((n, r) => n + r.delta7d, 0);
  const related = getTopics().filter((t) => t.slug !== slug).map((t) => ({ ...t, overlap: repos.filter((r) => repoTopics(r).includes(t.slug)).length }))
    .filter((t) => t.overlap >= 3).sort((a, b) => b.overlap - a.overlap).slice(0, 12);
  return (
    <>
      <JsonLd data={itemListLd(`Fastest-rising ${label} repos`, ranked)} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Topics", path: "/topic" }, { name: `Topic: ${label}`, path: `/topic/${slug}` }])} />
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <BackButton fallbackHref="/" />
        <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-zinc-500">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/topic" className="hover:underline">Topics</Link> / <span className="text-zinc-700 dark:text-zinc-300">Topic: {label}</span>
        </nav>
      </div>
      <section className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Topic</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Trending {label} repos</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Repos whose maintainers tagged them {topicVariants(slug).map((v, i) => (<span key={v}>{i > 0 && " or "}<span className="font-mono">{v}</span></span>))} on GitHub (topics are labels that describe what a project is about), ranked by stars gained.
        </p>
        {top.length > 0 && (
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            {repos.length} repos gained about {formatNumber(weekTotal)} stars in the last 7 days. Leading this week:{" "}
            {top.map((r, i) => (
              <span key={r.fullName}>
                {i > 0 && (i === top.length - 1 ? " and " : ", ")}
                <Link className="underline" href={`/repo/${r.owner}/${r.name}`}>{r.fullName}</Link>
              </span>
            ))}
            .
          </p>
        )}
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{repos.length} repos tracked · ranked by stars gained · updated hourly</p>
        {related.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-zinc-500">Related topics:</span>
            {related.map((t) => (
              <Link key={t.slug} href={`/topic/${t.slug}`} className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300">{topicLabel(t.slug)}</Link>
            ))}
          </p>
        )}
      </section>
      {repos.some((r) => r.velocityEstimated) && <EstimateNote className="mb-4" />}
      <Leaderboard repos={repos.map(toLeaderRepo)} />
      <HubIndex repos={repos} label={label} />
    </>
  );
}
