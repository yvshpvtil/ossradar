import { getLanguage, getLanguages } from "@/lib/languages";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "OSS Radar language leaderboard";
export const size = OG_SIZE;
export const contentType = "image/png";

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
