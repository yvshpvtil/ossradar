import { getRepos } from "./data";
import type { Repo } from "./types";

/** URL slug for a GitHub language name, e.g. "C++" -> "cpp", "Jupyter Notebook" -> "jupyter-notebook". */
export function languageSlug(lang: string): string {
  return lang.toLowerCase().replace(/\+\+/g, "pp").replace(/#/g, "sharp").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Languages with at least `min` tracked repos, most repos first. Only these get a hub page. */
export function getLanguages(min = 5): { slug: string; name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of getRepos()) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, n]) => n >= min)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ slug: languageSlug(name), name, count }));
}

export function getLanguage(slug: string) {
  return getLanguages().find((l) => l.slug === slug);
}

export function getReposByLanguage(name: string): Repo[] {
  return getRepos().filter((r) => r.language === name);
}
