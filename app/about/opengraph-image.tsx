import { getData } from "@/lib/data";
import { getArchiveDays } from "@/lib/daily";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "How OSS Radar ranks rising GitHub repos by star velocity";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card explaining the ranking method, so shared /about links preview what the page answers instead of the generic site card.
export default function Image() {
  const repos = getData().repos.length;
  const days = getArchiveDays().length;
  return ogCard({
    eyebrow: "Methodology",
    title: "How we rank rising GitHub repos: stars gained in 24 hours and 7 days",
    subtitle: "Star velocity, not total stars · updated hourly from the GitHub API · free JSON API",
    stat: repos ? `${repos} repos tracked${days ? ` · ${days} daily archives` : ""}` : undefined,
  });
}
