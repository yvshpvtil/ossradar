import raw from "@/data/mentions.json";

export type HnMention = {
  checkedAt: string;
  count: number;
  points: number;
  top: { id: string; title: string; points: number; comments: number; date: string } | null;
};

const file = raw as { updatedAt: string; repos: Record<string, HnMention> };

/** Hacker News stories linking to this repo (from data/mentions.json), or undefined if not checked yet. */
export function getHnMentions(fullName: string): HnMention | undefined {
  return file.repos[fullName];
}

/** Repos whose most-upvoted HN story was posted in the last `days` days, by that story's points. */
export function getRecentHn(days = 30, now = Date.now()): { fullName: string; m: HnMention }[] {
  const cutoff = new Date(now - days * 86_400_000).toISOString().slice(0, 10);
  return Object.entries(file.repos)
    .filter(([, m]) => m.top && m.top.date >= cutoff)
    .sort((a, b) => b[1].top!.points - a[1].top!.points)
    .map(([fullName, m]) => ({ fullName, m }));
}
