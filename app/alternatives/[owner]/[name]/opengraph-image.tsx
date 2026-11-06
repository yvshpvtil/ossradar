import { altLabel, getAlternatives, getAlternativesRepos, getRepo, hasAlternativesPage } from "@/lib/alternatives";
import { categoryLabel } from "@/lib/categories";
import { ogCard, OG_SIZE } from "@/lib/og";

const GENERIC_ALT = "OSS Radar card listing open-source alternatives to this GitHub repo";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getAlternativesRepos().map((r) => ({ owner: r.owner, name: r.name }));
}

/** Per-page alt text naming the project and its top alternatives, so previews and image search describe this card. */
function cardAlt(owner: string, name: string): string {
  const repo = getRepo(owner, name);
  if (!repo || !hasAlternativesPage(repo)) return GENERIC_ALT;
  const alts = getAlternatives(repo);
  const top = alts.slice(0, 3).map((a) => altLabel(a.repo));
  const list = top.length > 1 ? `${top.slice(0, -1).join(", ")} and ${top[top.length - 1]}` : top.join("");
  return `OSS Radar card: ${alts.length} open-source alternatives to ${altLabel(repo)}${list ? `, led by ${list}` : ""}`;
}

export async function generateImageMetadata({ params }: { params: { owner: string; name: string } }) {
  const p = await params;
  return [{ id: "card", alt: cardAlt(p.owner, p.name), size: OG_SIZE, contentType }];
}

// Names the subject repo and its closest alternatives, so shared links preview what's on the page.
export default async function Image({ params }: { params: Promise<{ owner: string; name: string }>; id: Promise<string> }) {
  const { owner, name } = await params;
  const repo = getRepo(owner, name);
  if (!repo || !hasAlternativesPage(repo)) return ogCard({ eyebrow: "Alternatives", title: "Open-source alternatives on GitHub" });
  const alts = getAlternatives(repo);
  return ogCard({
    eyebrow: `${categoryLabel(repo.category)} alternatives`,
    title: `${alts.length} open-source alternatives to ${altLabel(repo)}`,
    subtitle: alts.slice(0, 3).map((a) => altLabel(a.repo)).join(" · "),
    stat: alts.some((a) => !a.sameCategory) ? "Shared GitHub topics, ranked weekly" : "Same category, shared GitHub topics, ranked weekly",
  });
}
