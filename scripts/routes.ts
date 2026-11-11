/**
 * Writes data/routes.json: the lookup table proxy.ts needs to answer 404 / 410 / 308 / 307 before
 * rendering (which repo, hub and alternatives pages exist, canonical repo casing, retired repos).
 * Runs at prebuild, after retired.ts and data-pkg.mjs, using the same lib functions the pages use,
 * so the answers are identical to calling them in the proxy. Precomputing keeps the proxy bundle
 * small (no repos.json, no categorizer, no data/details reads at request time), which matters for
 * the Cloudflare Worker size limit and for runtimes without a filesystem.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CATEGORIES } from "../lib/categories";
import { getRepos } from "../lib/data";
import { LANDINGS } from "../lib/landing";
import { getLanguages, languageSlug } from "../lib/languages";
import { getTopics, repoTopics } from "../lib/topics";
import { hasAlternativesPage } from "../lib/alternatives";
import { getArchiveDays } from "../lib/daily";

const root = join(__dirname, "..", "data");
const repos = getRepos();
const canonicalOf = new Map(repos.map((r) => [r.fullName.toLowerCase(), `${r.owner}/${r.name}`]));
/** GitHub transfers/renames (scripts/renames.ts) whose new owner/name is tracked: old lowercased owner/name -> canonical new owner/name. */
const renamesFile = join(root, "renames.json");
const renamed = existsSync(renamesFile) ? (JSON.parse(readFileSync(renamesFile, "utf8")).moved as Record<string, string>) : {};
const moved = Object.fromEntries(
  Object.entries(renamed).flatMap(([old, now]) => {
    const target = canonicalOf.get(now.toLowerCase());
    return target && !canonicalOf.has(old) ? [[old, target]] : [];
  }),
);
const table = {
  /** lowercased owner/name -> canonical owner/name */
  repos: Object.fromEntries(repos.map((r) => [r.fullName.toLowerCase(), `${r.owner}/${r.name}`])),
  /** lowercased owner/name of tracked repos that have an alternatives page */
  alternatives: repos.filter(hasAlternativesPage).map((r) => r.fullName.toLowerCase()),
  categories: CATEGORIES.map((c) => c.slug),
  landings: LANDINGS.map((l) => l.slug),
  languages: getLanguages().map((l) => l.slug),
  topics: getTopics().map((t) => t.slug),
  /** language slugs / canonical topics still used by some tracked repo (dormant hubs redirect, not 404) */
  repoLanguages: [...new Set(repos.flatMap((r) => (r.language ? [languageSlug(r.language)] : [])))],
  repoTopics: [...new Set(repos.flatMap((r) => repoTopics(r)))],
  /** archived /daily/[date] pages (completed UTC days with both snapshots), same list the page uses */
  dailyDays: getArchiveDays(),
  moved,
  retired: JSON.parse(readFileSync(join(root, "retired.json"), "utf8")) as string[],
};
writeFileSync(join(root, "routes.json"), JSON.stringify(table) + "\n");
// Keep the node_modules mirror (scripts/data-pkg.mjs) in sync without a second pass.
copyFileSync(join(root, "routes.json"), join(__dirname, "..", "node_modules", "ossradar-data", "routes.json"));
console.log(`routes: ${repos.length} repos, ${table.alternatives.length} alternatives pages, ${table.topics.length} topics, ${table.retired.length} retired, ${Object.keys(moved).length} moved, ${table.dailyDays.length} daily days`);
