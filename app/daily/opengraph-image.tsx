import { getArchiveDays, getDailyTop } from "@/lib/daily";
import { formatDate, formatNumber } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "OSS Radar daily archive of the fastest-rising GitHub repos, day by day";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card naming the latest archived day's top risers, so shared /daily links preview the archive. /daily/[date] has its own card.
export default function Image() {
  const days = getArchiveDays();
  const latest = days[0];
  const top = latest ? getDailyTop(latest, 3) : [];
  return ogCard({
    eyebrow: "Daily archive",
    title: "The fastest-rising GitHub repos, day by day",
    subtitle: top.length ? top.map((e) => `${e.fullName.split("/")[1]} +${formatNumber(e.gained)}`).join(" · ") : undefined,
    stat: latest ? `${days.length} days archived · latest ${formatDate(latest)}` : undefined,
  });
}
