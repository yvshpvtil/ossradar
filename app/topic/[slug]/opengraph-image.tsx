import { ogCard, OG_SIZE } from "@/lib/og";
import { getReposByTopic, getTopics, hasTopicPage, topicLabel } from "@/lib/topics";

// One card per page; its alt names this page's subject and numbers instead of a generic line.
export function generateImageMetadata({ params }: { params: { slug: string } }) {
  return [{ id: "card", alt: cardAlt(params), size: OG_SIZE, contentType: "image/png" }];
}

function cardAlt({ slug }: { slug: string }): string {
  if (!hasTopicPage(slug)) return "OSS Radar leaderboard of the fastest-rising GitHub repos for a topic";
  return `OSS Radar card: the fastest-rising ${topicLabel(slug)} GitHub repos, ${getReposByTopic(slug).length} tracked`;
}

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
