import raw from "@/data/activity.json";

export type Release = { tag: string; name: string; date: string; url: string };
const file = raw as { updatedAt: string; repos: Record<string, { checkedAt: string; release: Release | null }> };

/** Latest GitHub release, null when the repo has none, undefined when not checked yet. */
export function getLatestRelease(fullName: string): Release | null | undefined {
  return file.repos[fullName]?.release;
}

/** "today", "3 days ago", "2 months ago" relative to `now`. */
export function ago(iso: string, now: number): string {
  const days = Math.floor((now - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 60) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months < 24 ? `${months} months ago` : `${Math.round(days / 365)} years ago`;
}
