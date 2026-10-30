import { categoryLabel } from "@/lib/categories";
import { getRepo, getRepos } from "@/lib/data";
import { formatDelta, formatNumber } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";

// One card per page; its alt names this page's subject and numbers instead of a generic line.
export function generateImageMetadata({ params }: { params: { owner: string; name: string } }) {
  return [{ id: "card", alt: cardAlt(params), size: OG_SIZE, contentType: "image/png" }];
}

function cardAlt({ owner, name }: { owner: string; name: string }): string {
  const repo = getRepo(owner, name);
  if (!repo) return `OSS Radar card for the GitHub repo ${owner}/${name}`;
  return `OSS Radar card for ${repo.fullName}: ${categoryLabel(repo.category)} repo with ${formatNumber(repo.stars)} GitHub stars, ${formatDelta(repo.delta7d)} this week${repo.estimated7d ? " (estimated)" : ""}`;
}

export function generateStaticParams() {
  return getRepos().map((r) => ({ owner: r.owner, name: r.name }));
}

export default async function Image({ params }: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo) return ogCard({ eyebrow: "Repo", title: `${owner}/${name}` });
  return ogCard({
    eyebrow: categoryLabel(repo.category),
    title: repo.fullName,
    subtitle: repo.oneLiner,
    stat: `${formatNumber(repo.stars)} stars · ${formatDelta(repo.delta7d)} this week${repo.estimated7d ? " (est.)" : ""}`,
  });
}
