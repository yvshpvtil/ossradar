import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EstimateNote } from "@/components/EstBadge";
import { Leaderboard } from "@/components/Leaderboard";
import { CATEGORIES, getCategory } from "@/lib/categories";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { getReposByCategory, rankRepos } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { breadcrumbLd, clip, itemListLd } from "@/lib/seo";
import { toLeaderRepo } from "@/lib/leader";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const title = `Trending ${category.label} GitHub repos, ranked by star velocity`;
  const description = clip(`Fastest-rising open-source ${category.label} projects on GitHub: ${category.description} Ranked by stars gained, updated hourly, on ${SITE.name}.`);
  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}` },
    openGraph: { title, description, url: `/category/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const repos = getReposByCategory(category.slug);
  const ranked = rankRepos(repos, "week");
  const top = ranked.slice(0, 3);
  const weekTotal = repos.reduce((n, r) => n + r.delta7d, 0);
  const path = `/category/${category.slug}`;
  return (
    <>
      <JsonLd data={itemListLd(`Fastest-rising ${category.label} repos`, ranked)} />
      <JsonLd data={breadcrumbLd([{ name: "Leaderboard", path: "/" }, { name: category.label, path }])} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-500">
        <Link href="/" className="hover:underline">Leaderboard</Link> / <span>{category.label}</span>
      </nav>
      <section className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Category</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Trending {category.label} repos</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">{category.description}</p>
        {top.length > 0 && (
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            OSS Radar tracks {repos.length} {category.label} repos that together gained about {formatNumber(weekTotal)} stars
            in the last 7 days. Leading this week:{" "}
            {top.map((r, i) => (
              <span key={r.fullName}>
                {i > 0 && (i === top.length - 1 ? " and " : ", ")}
                <Link className="underline" href={`/repo/${r.owner}/${r.name}`}>{r.fullName}</Link>
              </span>
            ))}
            .
          </p>
        )}
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{repos.length} repos tracked · ranked by stars gained this week · updated hourly</p>
      </section>
      {repos.some((r) => r.velocityEstimated) && <EstimateNote className="mb-4" />}
      <Leaderboard repos={repos.map(toLeaderRepo)} showCategoryFilter={false} />
      <section className="mt-10 text-sm">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Other categories</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {CATEGORIES.filter((c) => c.slug !== category.slug).map((c) => (
            <li key={c.slug}><Link className="text-indigo-600 hover:underline dark:text-indigo-400" href={`/category/${c.slug}`}>{c.label}</Link></li>
          ))}
        </ul>
      </section>
    </>
  );
}
