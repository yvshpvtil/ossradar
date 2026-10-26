/**
 * Writes data/retired.json: lowercased owner/name of every repo that appears in a daily
 * snapshot but isn't in the current tracked set. Runs before `next build` (prebuild) so the
 * proxy can answer 410 Gone for repo pages that once existed and have since dropped out,
 * instead of a generic 404, which tells search engines the URL was removed on purpose.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "data");
const tracked = new Set(
  (JSON.parse(readFileSync(join(root, "repos.json"), "utf8")).repos as { fullName: string }[]).map((r) => r.fullName.toLowerCase()),
);
const seen = new Set<string>();
for (const file of readdirSync(join(root, "snapshots")).filter((f) => f.endsWith(".json"))) {
  for (const name of Object.keys(JSON.parse(readFileSync(join(root, "snapshots", file), "utf8")))) seen.add(name.toLowerCase());
}
const retired = [...seen].filter((n) => !tracked.has(n)).sort();
writeFileSync(join(root, "retired.json"), JSON.stringify(retired) + "\n");
console.log(`retired: ${retired.length} once-tracked repos no longer in the tracked set`);
