import { repoBlurb } from "@/lib/blurb";
import { getData } from "@/lib/data";
import { categoryLabel } from "@/lib/categories";
import { ago, getLatestRelease } from "@/lib/activity";
import { getHnMentions } from "@/lib/mentions";
import type { PackedRow } from "@/app/compare/CompareView";

/** Every tracked repo as a compact compare-table tuple (avatar URL shortened to the GitHub user id). Served by /compare-data.json. */
export function getCompareRows(): { generatedAt: string; rows: PackedRow[] } {
  const data = getData();
  const now = Date.parse(data.generatedAt);
  const rows = data.repos.map((r): PackedRow => {
    const rel = getLatestRelease(r.fullName);
    const hn = getHnMentions(r.fullName);
    const m = r.ownerAvatar.match(/^https:\/\/avatars\.githubusercontent\.com\/u\/(\d+)\?v=4$/);
    return [
      r.fullName, repoBlurb(r) ?? "", m ? m[1] : r.ownerAvatar, r.stars, r.forks, r.delta24h, r.delta7d, r.velocityEstimated ? 1 : 0,
      r.language, categoryLabel(r.category), ago(r.createdAt, now), ago(r.pushedAt, now),
      rel ? `${rel.tag} (${ago(rel.date, now)})` : rel === null ? "None" : "—",
      hn ? (hn.count ? `${hn.count} stories, ${hn.points.toLocaleString("en-US")} points` : "None") : "—",
    ];
  });
  return { generatedAt: data.generatedAt, rows };
}
