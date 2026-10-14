import type { Metadata } from "next";
import Link from "next/link";
import { EstimateNote } from "@/components/EstBadge";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Leaderboard } from "@/components/Leaderboard";
import { CATEGORIES } from "@/lib/categories";
import { JsonLd } from "@/components/JsonLd";
import { getData, rankRepos } from "@/lib/data";
import { LANDINGS } from "@/lib/landing";
import { itemListLd } from "@/lib/seo";
import { toLeaderRepo } from "@/lib/leader";
import { SITE } from "@/lib/site";
import { RepoOfTheDay, pickRepoOfTheDay } from "@/components/RepoOfTheDay";
import { UpdatedClock } from "@/components/UpdatedClock";
import { TrendingGrid } from "@/components/TrendingGrid";
import { HomeSidebar } from "@/components/HomeSidebar";
import { getNewRepos } from "@/lib/newRepos";

export const metadata: Metadata = {
  title: { absolute: `Trending AI GitHub repos today: fastest-rising open-source AI & dev tools · ${SITE.name}` },
  alternates: { canonical: "/" },
};

export default function Home() {
  const data = getData();
  const anyEstimated = data.repos.some((r) => r.velocityEstimated);
  const now = Date.parse(data.generatedAt);
  const spotlight = pickRepoOfTheDay(data.repos);
  const trending = rankRepos(data.repos, "today").filter((r) => r.fullName !== spotlight?.fullName).slice(0, 6);
  const newCount = getNewRepos().reduce((n, g) => n + g.repos.length, 0);
  return (
    <>
      <JsonLd data={itemListLd("Fastest-rising open-source AI & dev-tool repos today", rankRepos(data.repos, "today"))} />
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Rising open-source AI &amp; dev tools</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          <strong className="text-zinc-900 dark:text-zinc-100">{SITE.ossExplainer}</strong> {SITE.tagline}
        </p>
        <div className="mt-4 max-w-xl">
          <NewsletterForm />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Tracking {data.repos.length} repos · <UpdatedClock generatedAt={data.generatedAt} /> ·{" "}
          {data.snapshotCount} daily snapshot{data.snapshotCount === 1 ? "" : "s"} so far
        </p>
      </section>
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <HomeSidebar repos={data.repos} newCount={newCount} />
      <div className="min-w-0">
      {spotlight && <RepoOfTheDay repo={spotlight} now={now} />}
      <TrendingGrid repos={trending} />
      <h2 id="leaderboard" className="mb-3 scroll-mt-6 text-xl font-semibold tracking-tight">Leaderboard</h2>
      {anyEstimated && <EstimateNote className="mb-4" />}
      <Leaderboard
        repos={data.repos.map(toLeaderRepo)}
        newDate={data.snapshotCount > 1 ? data.snapshotDate : null}
        showMovement={Boolean(data.rankBaseDate)}
        dataAt={data.generatedAt}
        generatedAtMs={now}
      />
      </div>
      </div>
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Browse by category</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="rounded-lg border border-zinc-200 p-4 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 dark:border-zinc-800 dark:hover:border-indigo-500"
            >
              <p className="font-medium">{c.label}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Popular views</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LANDINGS.map((l) => (
            <li key={l.slug}>
              <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href={`/trending/${l.slug}`}>{l.title}</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
