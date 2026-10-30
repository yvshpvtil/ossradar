import { altLabel, getAlternatives, getAlternativesRepos, getRepo, hasAlternativesPage } from "@/lib/alternatives";
import { categoryLabel } from "@/lib/categories";
import { ogCard, OG_SIZE } from "@/lib/og";

// One card per page; its alt names this page's subject and numbers instead of a generic line.
export function generateImageMetadata({ params }: { params: { owner: string; name: string } }) {
  return [{ id: "card", alt: cardAlt(params), size: OG_SIZE, contentType: "image/png" }];
}

function cardAlt({ owner, name }: { owner: string; name: string }): string {
  const repo = getRepo(owner, name);
  if (!repo || !hasAlternativesPage(repo)) return "OSS Radar card listing open-source alternatives to a GitHub repo";
  const alts = getAlternatives(repo);
  const lead = alts.slice(0, 3).map((a) => altLabel(a.repo));
  return `OSS Radar card: ${alts.length} open-source alternatives to ${altLabel(repo)}${lead.length ? `, led by ${listJoin(lead)}` : ""}`;
}

function listJoin(xs: string[]): string {
  return xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

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
    stat: alts.some((a) => !a.sameCategory) ? "Shared GitHub topics, ranked weekly" : "Same category, shared GitHub topics, ranked weekly",
  });
}
