import { ogCard, OG_SIZE } from "@/lib/og";
import { getReposByTopic, getTopics, hasTopicPage, topicLabel } from "@/lib/topics";

export const alt = "OSS Radar leaderboard of the fastest-rising GitHub repos for this topic";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getTopics().map((t) => ({ slug: t.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ok = hasTopicPage(slug);
  return ogCard({
    eyebrow: "Topic",
    title: `Rising ${topicLabel(slug)} repos`,
    subtitle: "The fastest-rising open-source GitHub repos with this topic",
    stat: ok ? `${getReposByTopic(slug).length} repos tracked` : undefined,
  });
}
