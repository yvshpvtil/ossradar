import { getData } from "@/lib/data";
import { ogCard, OG_SIZE } from "@/lib/og";
import { sponsorPricing } from "@/lib/sponsors";

export const alt = "Sponsor OSS Radar: one sponsor per week on the site and newsletter";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card for shared /sponsor links: what the slot is and its current weekly price (same source as the page).
export default function Image() {
  const { price } = sponsorPricing();
  const repos = getData().repos.length;
  return ogCard({
    eyebrow: "Sponsor",
    title: "Reach developers tracking rising open-source AI and dev-tool repos",
    subtitle: "One sponsor per week · site and daily newsletter · clearly labeled, never affects rankings",
    stat: `$${price}/week${repos ? ` · ${repos} repos tracked hourly` : ""}`,
  });
}
