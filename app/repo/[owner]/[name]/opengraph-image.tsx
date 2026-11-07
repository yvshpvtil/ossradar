import { altLabel } from "@/lib/alternatives";
import { categoryLabel } from "@/lib/categories";
import { getRepo, getRepos } from "@/lib/data";
import { formatDelta, formatNumber } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";

const GENERIC_ALT = "OSS Radar card for this GitHub repo: category, one-line summary, total stars and stars gained this week";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getRepos().map((r) => ({ owner: r.owner, name: r.name }));
}

/** Per-repo alt text, so link previews and image search describe this card, not a generic one. */
function cardAlt(owner: string, name: string): string {
  const repo = getRepo(owner, name);
  if (!repo) return GENERIC_ALT;
  const label = altLabel(repo);
  const who = label.toLowerCase() === repo.fullName.toLowerCase() ? repo.fullName : `${label} (${repo.fullName})`;
  const cat = repo.category === "other" ? "" : `, ${categoryLabel(repo.category)} category`;
  return `OSS Radar card for ${who}${cat}: ${formatNumber(repo.stars)} GitHub stars, ${formatDelta(repo.delta7d)} this week${repo.estimated7d ? " (est.)" : ""}`;
}

export async function generateImageMetadata({ params }: { params: { owner: string; name: string } }) {
  const p = await params;
  return [{ id: "card", alt: cardAlt(p.owner, p.name), size: OG_SIZE, contentType }];
}

export default async function Image({ params }: { params: Promise<{ owner: string; name: string }>; id: Promise<string> }) {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo) return ogCard({ eyebrow: "Repo", title: `${owner}/${name}` });
  // Card title matches the brand rule used by <title>/og:title (REA, not morluto/rea); unbranded
  // and generic/duplicate names keep owner/name so the card stays unambiguous.
  const label = altLabel(repo);
  const title = label.includes("/") || label === repo.name ? repo.fullName : label;
  return ogCard({
    eyebrow: categoryLabel(repo.category),
    title,
    subtitle: repo.oneLiner,
    stat: `${formatNumber(repo.stars)} stars · ${formatDelta(repo.delta7d)} this week${repo.estimated7d ? " (est.)" : ""}`,
  });
}
