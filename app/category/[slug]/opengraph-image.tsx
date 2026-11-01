import { CATEGORIES, getCategory } from "@/lib/categories";
import { getReposByCategory } from "@/lib/data";
import { hubCardAlt } from "@/lib/card-alt";
import { ogCard, OG_SIZE } from "@/lib/og";

const GENERIC_ALT = "OSS Radar leaderboard of the fastest-rising open-source repos in this category";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

// Per-hub alt text naming the category and its weekly leader (card URL: /opengraph-image/card).
export async function generateImageMetadata({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const category = getCategory(slug);
  return [{ id: "card", alt: category ? hubCardAlt(category.label, getReposByCategory(category.slug)) : GENERIC_ALT, size: OG_SIZE, contentType }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }>; id: Promise<string> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  return ogCard({
    eyebrow: "Category",
    title: `Rising ${category?.label ?? "repos"}`,
    subtitle: category?.description,
    stat: category ? `${getReposByCategory(category.slug).length} repos tracked` : undefined,
  });
}
