import { hubCardAlt } from "@/lib/card-alt";
import { ogCard, OG_SIZE } from "@/lib/og";
import { getReposByTopic, getTopics, hasTopicPage, topicLabel } from "@/lib/topics";

const GENERIC_ALT = "OSS Radar leaderboard of the fastest-rising GitHub repos for this topic";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getTopics().map((t) => ({ slug: t.slug }));
}

// Per-hub alt text naming the topic and its weekly leader (card URL: /opengraph-image/card).
export async function generateImageMetadata({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  return [{ id: "card", alt: hasTopicPage(slug) ? hubCardAlt(topicLabel(slug), getReposByTopic(slug)) : GENERIC_ALT, size: OG_SIZE, contentType }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }>; id: Promise<string> }) {
  const { slug } = await params;
  const ok = hasTopicPage(slug);
  return ogCard({
    eyebrow: "Topic",
    title: `Rising ${topicLabel(slug)} repos`,
    subtitle: "The fastest-rising open-source GitHub repos with this topic",
    stat: ok ? `${getReposByTopic(slug).length} repos tracked` : undefined,
  });
}
