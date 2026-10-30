import { deltaFor } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { LANDINGS, getLanding } from "@/lib/landing";
import { ogCard, OG_SIZE } from "@/lib/og";

// One card per page; its alt names this page's subject and numbers instead of a generic line.
export function generateImageMetadata({ params }: { params: { slug: string } }) {
  return [{ id: "card", alt: cardAlt(params), size: OG_SIZE, contentType: "image/png" }];
}

function cardAlt({ slug }: { slug: string }): string {
  const l = getLanding(slug);
  if (!l) return "OSS Radar card for a trending view of GitHub repos by stars gained";
  const top = l.select().slice(0, 3).map((r) => r.fullName);
  return `OSS Radar card: ${l.title}${top.length ? `, led by ${top.join(", ")}` : ""}`;
}

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
