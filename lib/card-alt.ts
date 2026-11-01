import { altLabel } from "./alternatives";
import { deltaFor, rankRepos } from "./data";
import { formatNumber } from "./format";
import type { Repo } from "./types";

const joinNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names.join(""));

/**
 * Alt text for a hub's Open Graph card (category, topic, language), naming what the card
 * covers and this week's top riser, so link previews, screen readers and image search
 * describe this card instead of one generic line shared by every hub.
 */
export function hubCardAlt(subject: string, repos: Repo[]): string {
  const base = `OSS Radar card: the ${repos.length} fastest-rising ${subject} repos on GitHub`;
  const leader = rankRepos(repos, "week")[0];
  if (!leader || leader.delta7d <= 0) return base;
  return `${base}, led this week by ${altLabel(leader)} (+${formatNumber(leader.delta7d)}${leader.estimated7d ? " est." : ""} stars)`;
}

/** Alt text for a trending view's card: the view's name and the top three gainers it shows. */
export function trendingCardAlt(title: string, top: Repo[], period: "today" | "week"): string {
  const names = top.filter((r) => deltaFor(r, period) > 0).map((r) => altLabel(r));
  return names.length ? `OSS Radar card for ${title}: top gainers ${joinNames(names)}` : `OSS Radar card for ${title}`;
}
