import { categoryLabel } from "@/lib/categories";
import { getRepo, getRepos } from "@/lib/data";
import { formatDelta, formatNumber } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "OSS Radar card for this GitHub repo: category, one-line summary, total stars and stars gained this week";
export const size = OG_SIZE;
export const contentType = "image/png";

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
