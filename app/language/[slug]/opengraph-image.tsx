import { getLanguage, getLanguages } from "@/lib/languages";
import { ogCard, OG_SIZE } from "@/lib/og";

// One card per page; its alt names this page's subject and numbers instead of a generic line.
export function generateImageMetadata({ params }: { params: { slug: string } }) {
  return [{ id: "card", alt: cardAlt(params), size: OG_SIZE, contentType: "image/png" }];
}

function cardAlt({ slug }: { slug: string }): string {
  const lang = getLanguage(slug);
  if (!lang) return "OSS Radar leaderboard of the fastest-rising GitHub repos in a language";
  return `OSS Radar card: the fastest-rising open-source ${lang.name} repos on GitHub, ${lang.count} tracked`;
}

export function generateStaticParams() {
  return getLanguages().map((l) => ({ slug: l.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = getLanguage(slug);
  return ogCard({
    eyebrow: "Language",
    title: `Rising ${lang?.name ?? ""} repos`,
    subtitle: lang ? `The fastest-rising open-source ${lang.name} AI and developer tools on GitHub` : undefined,
    stat: lang ? `${lang.count} repos tracked` : undefined,
  });
}
