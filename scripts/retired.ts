/**
 * Writes data/retired.json: lowercased owner/name of every repo that appears in a daily
 * snapshot but isn't in the current tracked set. Runs before `next build` (prebuild) so the
 * proxy can answer 410 Gone for repo pages that once existed and have since dropped out,
 * instead of a generic 404, which tells search engines the URL was removed on purpose.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isOffTopic, starFarmNames } from "../lib/blocklist";

const root = join(__dirname, "..", "data");
type RawRepo = { fullName: string; owner: string; name: string; description: string; topics: string[]; createdAt: string; forks: number; stars: number };
const raw = JSON.parse(readFileSync(join(root, "repos.json"), "utf8")).repos as RawRepo[];
// Same render-time filters as lib/data.ts, so a repo the site stops listing answers 410 right away.
const farm = starFarmNames(raw);
const tracked = new Set(raw.filter((r) => !isOffTopic(r) && !farm.has(r.fullName.toLowerCase())).map((r) => r.fullName.toLowerCase()));
const seen = new Set<string>();
for (const file of readdirSync(join(root, "snapshots")).filter((f) => f.endsWith(".json"))) {
  for (const name of Object.keys(JSON.parse(readFileSync(join(root, "snapshots", file), "utf8")))) seen.add(name.toLowerCase());
}
const retired = [...seen].filter((n) => !tracked.has(n)).sort();
writeFileSync(join(root, "retired.json"), JSON.stringify(retired) + "\n");
console.log(`retired: ${retired.length} once-tracked repos no longer in the tracked set`);
