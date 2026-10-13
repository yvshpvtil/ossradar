import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EstimateNote } from "@/components/EstBadge";
import { Leaderboard } from "@/components/Leaderboard";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { getReposByCategory } from "@/lib/data";
import { toLeaderRepo } from "@/lib/leader";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const title = `Fastest-rising ${category.label} repos`;
  return {
    title,
    description: `${category.description} Ranked daily by GitHub star velocity on ${SITE.name}.`,
    alternates: { canonical: `/category/${slug}` },
    openGraph: { title, url: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const repos = getReposByCategory(category.slug);
  return (
    <>
      <section className="mb-6">
        <p className="text-sm text-zinc-500">Category</p>
        <h1 className="text-3xl font-bold tracking-tight">{category.label}</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">{category.description}</p>
        <p className="mt-1 text-xs text-zinc-500">{repos.length} repos tracked</p>
      </section>
      {repos.some((r) => r.velocityEstimated) && <EstimateNote className="mb-4" />}
      <Leaderboard repos={repos.map(toLeaderRepo)} showCategoryFilter={false} />
    </>
  );
}
