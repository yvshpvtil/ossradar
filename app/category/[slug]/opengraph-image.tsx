import { CATEGORIES, getCategory } from "@/lib/categories";
import { getReposByCategory } from "@/lib/data";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "OSS Radar leaderboard of the fastest-rising open-source repos in this category";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  return ogCard({
    eyebrow: "Category",
    title: `Rising ${category?.label ?? "repos"}`,
    subtitle: category?.description,
    stat: category ? `${getReposByCategory(category.slug).length} repos tracked` : undefined,
  });
}
