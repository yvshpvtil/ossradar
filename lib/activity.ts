import raw from "@/data/activity.json";

export type Release = { tag: string; name: string; date: string; url: string };
const file = raw as { updatedAt: string; repos: Record<string, { checkedAt: string; release: Release | null }> };

/** Latest GitHub release, null when the repo has none, undefined when not checked yet. */
export function getLatestRelease(fullName: string): Release | null | undefined {
  return file.repos[fullName]?.release;
}

/**
 * The repo's own version for schema.org softwareVersion, or undefined. Monorepos often cut their
 * latest release for a sub-package ("@upstash/context7-sdk@0.6.0", "ts-v3.3.1", "@mastra/core@1.79.0"),
 * which isn't the repo's version, and some tags aren't versions at all ("thanks", "build-2026...").
 * Accept a bare version ("v1.2.3", "2.0.0-beta.1", "1.6.6rc1") or one prefixed with the repo's own name
 * ("n8n@2.44.7", "chrome-devtools-mcp-v1.12.0"); return it without the prefix or leading v.
 */
export function releaseVersion(tag: string | undefined, repoName: string): string | undefined {
  if (!tag) return undefined;
  const ver = /^v?(\d+(?:\.\d+)+(?:[-+.]?[0-9A-Za-z][0-9A-Za-z.-]*)?)$/;
  const bare = tag.match(ver);
  if (bare) return bare[1];
  const name = repoName.toLowerCase();
  const lower = tag.toLowerCase();
  for (const sep of ["@", "-", "/", "_"]) {
    if (lower.startsWith(name + sep)) {
      const m = tag.slice(name.length + 1).match(ver);
      if (m) return m[1];
    }
  }
  return undefined;
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
