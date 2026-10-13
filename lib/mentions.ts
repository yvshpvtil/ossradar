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
