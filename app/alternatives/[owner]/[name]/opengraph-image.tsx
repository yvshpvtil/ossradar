import { altLabel, getAlternatives, getAlternativesRepos, getRepo, hasAlternativesPage } from "@/lib/alternatives";
import { categoryLabel } from "@/lib/categories";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "OSS Radar card listing open-source alternatives to this GitHub repo";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getAlternativesRepos().map((r) => ({ owner: r.owner, name: r.name }));
}

// Names the subject repo and its closest alternatives, so shared links preview what's on the page.
export default async function Image({ params }: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo || !hasAlternativesPage(repo)) return ogCard({ eyebrow: "Alternatives", title: "Open-source alternatives on GitHub" });
  const alts = getAlternatives(repo);
  return ogCard({
    eyebrow: `${categoryLabel(repo.category)} alternatives`,
    title: `${alts.length} open-source alternatives to ${altLabel(repo)}`,
    subtitle: alts.slice(0, 3).map((a) => a.repo.fullName).join(" · "),
    stat: "Same category, shared GitHub topics, ranked weekly",
  });
}
