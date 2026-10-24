import { CATEGORIES } from "@/lib/categories";
import { getReposByCategory } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "Directory of category hubs ranking rising open-source AI and dev-tool repos on OSS Radar";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card naming the categories that gained the most stars this week, so shared /category links preview the directory instead of the generic site card.
export default function Image() {
  const busiest = CATEGORIES.filter((c) => c.slug !== "other")
    .map((c) => ({ label: c.label, week: getReposByCategory(c.slug).reduce((n, r) => n + r.delta7d, 0) }))
    .filter((c) => c.week > 0)
    .sort((a, b) => b.week - a.week)
    .slice(0, 3);
  return ogCard({
    eyebrow: "Categories",
    title: "Browse rising open-source repos by category",
    subtitle: busiest.length ? busiest.map((c) => `${c.label} +${formatNumber(c.week)}`).join(" · ") : undefined,
    stat: `${CATEGORIES.length} category hubs`,
  });
}
