import { formatNumber } from "@/lib/format";
import { getLanguages, getReposByLanguage } from "@/lib/languages";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "Directory of programming-language hubs ranking rising open-source repos on OSS Radar";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card naming the languages whose repos gained the most stars this week, so shared /language links preview the directory instead of the generic site card.
export default function Image() {
  const langs = getLanguages();
  const busiest = langs
    .map((l) => ({ name: l.name, week: getReposByLanguage(l.name).reduce((n, r) => n + r.delta7d, 0) }))
    .filter((l) => l.week > 0)
    .sort((a, b) => b.week - a.week)
    .slice(0, 3);
  return ogCard({
    eyebrow: "Languages",
    title: "Browse rising open-source repos by programming language",
    subtitle: busiest.length ? busiest.map((l) => `${l.name} +${formatNumber(l.week)}`).join(" · ") : undefined,
    stat: langs.length ? `${langs.length} language hubs` : undefined,
  });
}
