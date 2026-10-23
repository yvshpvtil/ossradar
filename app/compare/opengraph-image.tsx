import { CATEGORIES } from "@/lib/categories";
import { getReposByCategory, rankRepos } from "@/lib/data";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "Compare GitHub repos side by side on OSS Radar";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card naming this week's top head-to-heads (same pairs as the page's popular comparisons).
export default function Image() {
  const pairs: string[] = [];
  for (const cat of CATEGORIES) {
    if (pairs.length >= 2) break;
    const top = rankRepos(getReposByCategory(cat.slug), "week");
    if (top.length >= 2) pairs.push(`${top[0].name} vs ${top[1].name}`);
  }
  return ogCard({
    eyebrow: "Compare",
    title: "Compare GitHub repos side by side",
    subtitle: pairs.length ? pairs.join(" · ") : undefined,
    stat: "Stars, growth, releases and HN buzz",
  });
}
