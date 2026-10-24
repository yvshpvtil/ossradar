import { getAlternativesRepos } from "@/lib/alternatives";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "Directory of open-source alternatives to the fastest-rising GitHub repos on OSS Radar";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card naming this week's fastest risers that have an alternatives list, so shared /alternatives links preview the directory.
export default function Image() {
  const repos = getAlternativesRepos();
  const top = [...repos].sort((a, b) => b.delta7d - a.delta7d).slice(0, 3);
  return ogCard({
    eyebrow: "Alternatives",
    title: "Open-source alternatives to the fastest-rising GitHub repos",
    subtitle: top.length ? `Alternatives to ${top.map((r) => r.name).join(" · ")}` : undefined,
    stat: repos.length ? `${repos.length} repos with alternatives` : undefined,
  });
}
