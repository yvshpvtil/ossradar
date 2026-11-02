/**
 * Mirrors data/*.json into node_modules/ossradar-data so the app imports the data as an
 * external package ("ossradar-data/repos.json") instead of a relative path. Turbopack inlines
 * relative JSON into every chunk group that uses it (repos.json ended up 4x in the server
 * bundle); as a serverExternalPackage it is loaded once. That keeps the Cloudflare Worker
 * bundle under the 3 MiB free-plan limit and does not change behavior on Vercel.
 * Runs on postinstall (so scripts run right after `npm ci`, like the hourly collect, can import
 * lib/ modules) and again in prebuild/predev after retired.ts, so builds see the current data/ files.
 * Plain Node (no tsx) so it also works when devDependencies are not installed.
 * (A real copy, not a symlink: Turbopack only externalizes packages that live in node_modules.)
 */
import { copyFileSync, lstatSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const src = join(__dirname, "..", "data");
const dest = join(__dirname, "..", "node_modules", "ossradar-data");
try {
  if (lstatSync(dest).isSymbolicLink()) rmSync(dest);
} catch {
  // not there yet
}
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
writeFileSync(join(dest, "package.json"), JSON.stringify({ name: "ossradar-data", version: "0.0.0", private: true }) + "\n");
const files = readdirSync(src).filter((f) => f.endsWith(".json"));
for (const f of files) copyFileSync(join(src, f), join(dest, f));
console.log(`ossradar-data: mirrored ${files.length} data files into node_modules`);
