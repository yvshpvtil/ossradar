import { formatNumber } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";
import { getReposByTopic, getTopics, topicLabel } from "@/lib/topics";

export const alt = "Directory of GitHub topic hubs ranking rising open-source repos on OSS Radar";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card naming the busiest topic hubs this week, so shared /topic links preview the directory instead of the generic site card.
export default function Image() {
  const topics = getTopics();
  const busiest = topics
    .map((t) => ({ label: topicLabel(t.slug), week: getReposByTopic(t.slug).reduce((n, r) => n + r.delta7d, 0) }))
    .sort((a, b) => b.week - a.week)
    .slice(0, 3);
  return ogCard({
    eyebrow: "Topics",
    title: "Browse rising open-source repos by GitHub topic",
    subtitle: busiest.length ? busiest.map((t) => `${t.label} +${formatNumber(t.week)}`).join(" · ") : undefined,
    stat: topics.length ? `${topics.length} topic hubs` : undefined,
  });
}
