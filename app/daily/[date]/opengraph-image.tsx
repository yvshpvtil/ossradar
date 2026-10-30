import { getArchiveDays, getDailyTop } from "@/lib/daily";
import { formatDate, formatNumber } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";

// One card per page; its alt names this page's subject and numbers instead of a generic line.
export function generateImageMetadata({ params }: { params: { date: string } }) {
  return [{ id: "card", alt: cardAlt(params), size: OG_SIZE, contentType: "image/png" }];
}

function cardAlt({ date }: { date: string }): string {
  if (!getArchiveDays().includes(date)) return "OSS Radar daily archive of the fastest-rising GitHub repos";
  const top = getDailyTop(date).slice(0, 3).map((e) => e.fullName);
  return `OSS Radar card: the fastest-rising GitHub repos on ${formatDate(date)}${top.length ? `, led by ${top.join(", ")}` : ""}`;
}

export function generateStaticParams() {
  const days = getArchiveDays();
  return days.length ? days.map((date) => ({ date })) : [{ date: "none" }];
}

// A dated card naming that day's top gainers, so shared archive links preview what's on the page.
export default async function Image({ params }: { params: Promise<{ date: string }> }) {
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
