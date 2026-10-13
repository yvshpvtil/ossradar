import { getRepos } from "./data";
import type { Repo } from "./types";

export const TOPIC_MIN = 10;

/** GitHub topics used by at least TOPIC_MIN tracked repos, most used first. Only these get a hub page. */
export function getTopics(): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of getRepos()) for (const t of r.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].filter(([, n]) => n >= TOPIC_MIN).sort((a, b) => b[1] - a[1]).map(([slug, count]) => ({ slug, count }));
}

export const hasTopicPage = (slug: string) => getTopics().some((t) => t.slug === slug);
export const getReposByTopic = (slug: string): Repo[] => getRepos().filter((r) => r.topics.includes(slug));
