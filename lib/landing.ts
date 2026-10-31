import { getData, getRepos, rankRepos } from "./data";
import type { Repo } from "./types";

export interface Landing {
  slug: string;
  title: string;
  /** Short anchor text for sitewide (footer) links. */
  navLabel: string;
  h1: string;
  description: string;
  /** Opening of the live meta description; the view's current top gainers are appended when they fit. */
  metaHead: string;
  intro: string;
  select: () => Repo[];
}

const DAY = 86_400_000;
const ageDays = (r: Repo) => (new Date(getData().generatedAt).getTime() - new Date(r.createdAt).getTime()) / DAY;

export const LANDINGS: Landing[] = [
  {
    slug: "ai-repos-this-week",
    navLabel: "Trending AI repos this week",
    title: "Trending AI GitHub repos this week",
    h1: "Trending open-source AI repos this week",
    description: "The open-source AI repos on GitHub gaining the most stars over the last 7 days: agents, LLM tooling, MCP servers, RAG and local models. Updated hourly.",
    metaHead: "Open-source AI repos gaining the most GitHub stars in the last 7 days, updated hourly.",
    intro: "Every AI project OSS Radar tracks, ranked by stars gained in the last seven days. Weekly velocity smooths out one-day spikes from a single viral post, so this is the best view of what is actually gaining traction.",
    select: () => rankRepos(getRepos().filter((r) => r.category !== "devops"), "week"),
  },
  {
    slug: "github-repos-today",
    navLabel: "Fastest-growing repos today",
    title: "Fastest-growing GitHub repos today",
    h1: "Fastest-growing open-source GitHub repos today",
    description: "Open-source AI and developer-tool repos gaining the most GitHub stars in the last 24 hours, updated hourly: what developers are starring right now.",
    metaHead: "Open-source AI and dev-tool repos gaining the most GitHub stars in the last 24 hours.",
    intro: "Ranked by stars gained in the last 24 hours. This is the most reactive view: it catches repos the day they hit Hacker News, X or a newsletter.",
    select: () => rankRepos(getRepos(), "today"),
  },
  {
    slug: "new-ai-repos",
    navLabel: "New AI repos (30 days)",
    title: "New open-source AI repos (last 30 days)",
    h1: "New open-source AI & dev-tool repos from the last 30 days",
    description: "Brand-new GitHub repos, created in the last 30 days, that are already gaining stars fast. Find promising open-source AI and dev tools early.",
    metaHead: "GitHub repos created in the last 30 days that are already gaining stars fast.",
    intro: "Only repos created in the last 30 days, ranked by 7-day star velocity. Useful for spotting projects before they are everywhere.",
    select: () => rankRepos(getRepos().filter((r) => ageDays(r) <= 30), "week"),
  },
];

export const getLanding = (slug: string) => LANDINGS.find((l) => l.slug === slug);
