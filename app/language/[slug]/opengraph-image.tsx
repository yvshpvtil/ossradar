import { hubCardAlt } from "@/lib/card-alt";
import { getLanguage, getLanguages, getReposByLanguage } from "@/lib/languages";
import { ogCard, OG_SIZE } from "@/lib/og";

const GENERIC_ALT = "OSS Radar leaderboard of the fastest-rising GitHub repos in this language";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getLanguages().map((l) => ({ slug: l.slug }));
}

// Per-hub alt text naming the language and its weekly leader (card URL: /opengraph-image/card).
export async function generateImageMetadata({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const lang = getLanguage(slug);
  return [{ id: "card", alt: lang ? hubCardAlt(lang.name, getReposByLanguage(lang.name)) : GENERIC_ALT, size: OG_SIZE, contentType }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }>; id: Promise<string> }) {
  const { slug } = await params;
  const lang = getLanguage(slug);
  return ogCard({
    eyebrow: "Language",
    title: `Rising ${lang?.name ?? ""} repos`,
    subtitle: lang ? `The fastest-rising open-source ${lang.name} AI and developer tools on GitHub` : undefined,
    stat: lang ? `${lang.count} repos tracked` : undefined,
  });
}
