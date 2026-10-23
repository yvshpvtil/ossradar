import { getData } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { getRecentHn } from "@/lib/mentions";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "GitHub repos trending on Hacker News, on OSS Radar";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card naming the repos whose HN stories drew the most points this month, so shared links preview the page.
export default function Image() {
  const list = getRecentHn(30, Date.parse(getData().generatedAt));
  const top = list.slice(0, 3);
  return ogCard({
    eyebrow: "Hacker News",
    title: "GitHub repos trending on Hacker News this month",
    subtitle: top.length ? top.map(({ fullName, m }) => `${fullName.split("/")[1]} ${formatNumber(m.top!.points)} pts`).join(" · ") : undefined,
    stat: list.length ? `${list.length} repos on HN in 30 days` : undefined,
  });
}
