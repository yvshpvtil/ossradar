import { deltaFor } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { LANDINGS, getLanding } from "@/lib/landing";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "OSS Radar trending leaderboard";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return LANDINGS.map((l) => ({ slug: l.slug }));
}

// A card naming the view and its current top three, so shared /trending links preview what's on the page.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getLanding(slug);
  const period = slug === "github-repos-today" ? "today" : "week";
  const top = l ? l.select().slice(0, 3) : [];
  return ogCard({
    eyebrow: "Trending",
    title: l?.title ?? "Trending GitHub repos",
    subtitle: top.length ? top.map((r) => `${r.name} +${formatNumber(deltaFor(r, period))}`).join(" · ") : undefined,
    stat: l ? `${l.select().length} repos ranked by stars gained ${period === "today" ? "in 24 hours" : "in 7 days"}` : undefined,
  });
}
