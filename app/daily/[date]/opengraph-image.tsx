import { getArchiveDays, getDailyTop } from "@/lib/daily";
import { formatDate, formatNumber } from "@/lib/format";
import { dailyCardAlt } from "@/lib/card-alt";
import { ogCard, OG_SIZE } from "@/lib/og";

const GENERIC_ALT = "OSS Radar daily top 25 fastest-rising GitHub repos for this date";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  const days = getArchiveDays();
  return days.length ? days.map((date) => ({ date })) : [{ date: "none" }];
}

// Per-day alt text naming the date and its top three gainers (card URL: /opengraph-image/card).
export async function generateImageMetadata({ params }: { params: { date: string } }) {
  const { date } = await params;
  const ok = getArchiveDays().includes(date);
  return [{ id: "card", alt: ok ? dailyCardAlt(date, getDailyTop(date, 3)) : GENERIC_ALT, size: OG_SIZE, contentType }];
}

// A dated card naming that day's top gainers, so shared archive links preview what's on the page.
export default async function Image({ params }: { params: Promise<{ date: string }>; id: Promise<string> }) {
  const { date } = await params;
  const ok = getArchiveDays().includes(date);
  const top = ok ? getDailyTop(date).slice(0, 3) : [];
  return ogCard({
    eyebrow: "Daily archive",
    title: ok ? `Top rising repos on ${formatDate(date)}` : "Daily archive of rising GitHub repos",
    subtitle: top.length ? top.map((e) => `${e.fullName.split("/")[1]} +${formatNumber(e.gained)}`).join(" · ") : undefined,
    stat: top.length ? "Stars gained during this UTC day" : undefined,
  });
}
