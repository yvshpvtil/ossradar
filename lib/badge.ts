import { getRepos, rankRepos } from "./data";
import type { Repo } from "./types";

// Approximate Verdana 11px text width (shields.io-style badges).
export const textWidth = (s: string) => Math.round(s.length * 6.6 + 10);

export function badgeSpec(repo: Repo | undefined) {
  const label = "OSS Radar";
  let message = "not tracked";
  let color = "#9f9f9f";
  if (repo) {
    const rank = rankRepos(getRepos(), "today").findIndex((r) => r.fullName === repo.fullName) + 1;
    [message, color] = rank <= 100 ? [`Trending #${rank}`, "#059669"] : ["Tracked", "#52525b"];
  }
  const lw = textWidth(label) + 16; // room for the radar mark
  const mw = textWidth(message);
  return { label, message, color, lw, mw, width: lw + mw };
}
