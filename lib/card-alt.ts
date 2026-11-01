import { altLabel } from "./alternatives";
import { deltaFor, rankRepos } from "./data";
import { formatDate, formatNumber } from "./format";
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

/** A daily-archive gainer by its project name (altLabel for tracked repos; untracked repos keep the slug). */
export const dayLabel = (e: { fullName: string; repo?: Repo }) => {
  const [owner, name] = e.fullName.split("/");
  return e.repo ? altLabel(e.repo) : name ?? owner;
};

/** Alt text for a /daily/<date> card: the date and that day's top three gainers with stars gained. */
export function dailyCardAlt(date: string, top: { fullName: string; gained: number; repo?: Repo }[]): string {
  const base = `OSS Radar card: top rising GitHub repos on ${formatDate(date)}`;
  const names = top.slice(0, 3).map((e, i) => `${dayLabel(e)} (+${formatNumber(e.gained)}${i ? "" : " stars"})`);
  return names.length ? `${base}, led by ${joinNames(names)}` : base;
}
