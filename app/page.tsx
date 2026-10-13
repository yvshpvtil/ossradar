import Link from "next/link";
import { EstimateNote } from "@/components/EstBadge";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Leaderboard } from "@/components/Leaderboard";
import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { toLeaderRepo } from "@/lib/leader";
import { SITE } from "@/lib/site";

export default function Home() {
  const data = getData();
  const anyEstimated = data.repos.some((r) => r.velocityEstimated);
  return (
    <>
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Rising open-source AI &amp; dev tools</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          <strong className="text-zinc-900 dark:text-zinc-100">{SITE.ossExplainer}</strong> {SITE.tagline}
        </p>
        <div className="mt-4 max-w-xl">
          <NewsletterForm compact id="hero" />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Tracking {data.repos.length} repos · updated {formatDate(data.generatedAt)} ·{" "}
          {data.snapshotCount} daily snapshot{data.snapshotCount === 1 ? "" : "s"} so far
        </p>
      </section>
      {anyEstimated && <EstimateNote className="mb-4" />}
      <Leaderboard repos={data.repos.map(toLeaderRepo)} />
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Browse by category</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="rounded-lg border border-zinc-200 p-3 hover:border-indigo-400 dark:border-zinc-800 dark:hover:border-indigo-500"
            >
              <p className="font-medium">{c.label}</p>
              <p className="text-xs text-zinc-500">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
