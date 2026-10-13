import { ogCard, OG_SIZE } from "@/lib/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: fastest-rising open-source AI & dev tools`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Daily leaderboard",
    title: "Fastest-rising open-source AI & dev tools",
    subtitle: "Ranked by GitHub star velocity (24h / 7d), with a one-line take on each repo.",
  });
}
