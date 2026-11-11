/**
 * Writes data/renames.json: once-tracked repos that were transferred or renamed on GitHub and are
 * tracked again under their new owner/name (bherbruck/solidcraft -> tangency-labs/solidcraft).
 * Without it the old /repo URL, which search engines, social posts and the newsletter archive may
 * still link to, answers 410 Gone while the same project lives on at a new URL; routes.ts turns the
 * entries whose target is tracked into 308s in proxy.ts.
 *
 * Only plausible moves are checked: a retired name that shares its repo name with a tracked repo
 * (transfer) or its owner (rename). GitHub's API follows the old name to the repo's current
 * full_name. Each candidate is checked once, then again after RECHECK_DAYS, at most RENAMES_LIMIT
 * per run (cheap on the hourly GITHUB_TOKEN budget).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isOffTopic, starFarmNames } from "../lib/blocklist";

const root = join(__dirname, "..", "data");
const file = join(root, "renames.json");
const token = process.env.GITHUB_TOKEN;
const LIMIT = Number(process.env.RENAMES_LIMIT ?? 60);
const RECHECK_DAYS = 7;

type RawRepo = { fullName: string; owner: string; name: string; description: string; topics: string[]; createdAt: string; forks: number; stars: number };
type Renames = { checked: Record<string, string>; moved: Record<string, string> };

async function main() {
  if (!token) return console.log("renames: no GITHUB_TOKEN, skipped");
  const raw = JSON.parse(readFileSync(join(root, "repos.json"), "utf8")).repos as RawRepo[];
  // Same tracked set as scripts/retired.ts.
  const farm = starFarmNames(raw);
  const tracked = raw.filter((r) => !isOffTopic(r) && !farm.has(r.fullName.toLowerCase())).map((r) => r.fullName.toLowerCase());
  const trackedSet = new Set(tracked);
  const names = new Set(tracked.map((n) => n.split("/")[1]));
  const owners = new Set(tracked.map((n) => n.split("/")[0]));
  const seen = new Set<string>();
  for (const f of readdirSync(join(root, "snapshots")).filter((x) => x.endsWith(".json"))) {
    for (const n of Object.keys(JSON.parse(readFileSync(join(root, "snapshots", f), "utf8")))) seen.add(n.toLowerCase());
  }
  const state: Renames = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { checked: {}, moved: {} };
  const today = new Date().toISOString().slice(0, 10);
  const stale = (n: string) => !state.checked[n] || Date.parse(today) - Date.parse(state.checked[n]) >= RECHECK_DAYS * 864e5;
  const candidates = [...seen]
    .filter((n) => !trackedSet.has(n) && (names.has(n.split("/")[1]) || owners.has(n.split("/")[0])) && stale(n))
    .sort((a, b) => (state.checked[a] ?? "").localeCompare(state.checked[b] ?? "") || a.localeCompare(b))
    .slice(0, LIMIT);
  let found = 0;
  for (const old of candidates) {
    const res = await fetch(`https://api.github.com/repos/${old}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "ossradar-renames" },
    });
    if (res.status === 403 || res.status === 429) break; // rate limited: try the rest next run
    if (res.ok) {
      const now = ((await res.json()) as { full_name?: string }).full_name;
      if (now && now.toLowerCase() !== old) {
        state.moved[old] = now;
        found++;
      } else delete state.moved[old];
    } else if (res.status === 404 || res.status === 451) delete state.moved[old];
    else continue; // transient error: leave unchecked
    state.checked[old] = today;
  }
  const sorted = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(file, JSON.stringify({ checked: sorted(state.checked), moved: sorted(state.moved) }, null, 1) + "\n");
  const live = Object.values(state.moved).filter((n) => trackedSet.has(n.toLowerCase())).length;
  console.log(`renames: checked ${candidates.length}, ${found} moved this run, ${Object.keys(state.moved).length} known moves (${live} to tracked repos)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
