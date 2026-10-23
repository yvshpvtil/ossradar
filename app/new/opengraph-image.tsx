import { formatNumber } from "@/lib/format";
import { NEW_DAYS, getNewRepos } from "@/lib/newRepos";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "New open-source AI and dev-tool repos on OSS Radar";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card naming the newest launches gaining the most stars, so shared /new links preview what's on the page.
export default function Image() {
  const repos = getNewRepos().flatMap((g) => g.repos);
  const top = [...repos].sort((a, b) => b.delta7d - a.delta7d).slice(0, 3);
  return ogCard({
    eyebrow: "New repos",
    title: `New open-source AI and dev-tool repos from the last ${NEW_DAYS} days`,
    subtitle: top.length ? top.map((r) => `${r.name} +${formatNumber(r.delta7d)}`).join(" · ") : undefined,
    stat: repos.length ? `${repos.length} new repos tracked` : undefined,
  });
}
