/**
 * Refresh data/blurbs.json: English one-liners for repos whose best available line is mostly
 * Chinese/Japanese/Korean or a README fragment that starts mid-thought ("It ships…", "That opens…").
 * Runs LOCALLY with the Claude Code CLI (`claude -p`); the hourly job and site only read the file.
 *
 *   npm run blurbs            # fill missing/stale entries
 *   BLURBS_FORCE=1 npm run blurbs
 */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { promisify } from "node:util";
import { cjkRatio, cleanBlurb, needsOverride } from "../lib/blurb";
import type { BlurbOverride } from "../lib/blurbOverrides";
import type { RepoData } from "../lib/types";

const run = promisify(execFile);
const FILE = "data/blurbs.json";
const CLAUDE = process.env.CLAUDE_BIN || "claude";

const repos = (JSON.parse(readFileSync("data/repos.json", "utf8")) as RepoData).repos;
const out: Record<string, BlurbOverride> = JSON.parse(readFileSync(FILE, "utf8"));
const details = (n: string) => {
  const f = `data/details/${n.replace("/", "__")}.json`;
  return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as { readmeSummary?: string | null }) : {};
};

async function readme(n: string): Promise<string> {
  try {
    const { stdout } = await run("gh", ["api", "-H", "Accept: application/vnd.github.raw+json", `repos/${n}/readme`], { maxBuffer: 20 << 20 });
    return stdout;
  } catch { return ""; }
}

async function generate(n: string, description: string, md: string): Promise<string | null> {
  const prompt = `Write ONE plain English sentence (max 120 characters) saying what the GitHub project ${n} is or does.
Rules: use only facts stated in the description/README below; translate if they are not in English; no hype or marketing words; no claims about popularity, quality or speed unless stated; do not start with the repo name; output only the sentence.

Description: ${description || "(none)"}

README (excerpt):
${md.slice(0, 5000) || "(none)"}`;
  try {
    const { stdout } = await run(CLAUDE, ["-p", prompt], { timeout: 120_000, maxBuffer: 1 << 20 });
    const line = stdout.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
    const t = cleanBlurb(line.replace(/^["'“]|["'”]$/g, ""));
    return t && cjkRatio(t) === 0 && t.length >= 20 ? t : null;
  } catch { return null; }
}

async function main() {
  const todo = repos
    .map((r) => {
      const current = cleanBlurb(r.description) ?? cleanBlurb(details(r.fullName).readmeSummary);
      const basis = createHash("sha1").update(`${r.description}|${details(r.fullName).readmeSummary ?? ""}`).digest("hex").slice(0, 12);
      return { r, current, basis };
    })
    .filter(({ r, current, basis }) => needsOverride(current) && (process.env.BLURBS_FORCE || out[r.fullName]?.basis !== basis));
  console.log(`blurbs: ${todo.length} repos need an English one-liner`);
  let i = 0, ok = 0;
  const worker = async () => {
    while (i < todo.length) {
      const { r, basis } = todo[i++];
      const text = await generate(r.fullName, r.description, await readme(r.fullName));
      if (text) {
        out[r.fullName] = { text, basis, source: "claude -p", generatedAt: new Date().toISOString() };
        ok++;
        console.log(`  ✓ ${r.fullName}: ${text}`);
      } else console.warn(`  ✗ ${r.fullName}: no valid line`);
    }
  };
  await Promise.all(Array.from({ length: Number(process.env.BLURBS_CONCURRENCY ?? 4) }, worker));
  // Keep entries for repos that dropped out of the tracked set: they often come back (churn), and
  // hand translations would otherwise be lost. The basis hash still forces a refresh if the source text changes.
  writeFileSync(FILE, JSON.stringify(Object.fromEntries(Object.entries(out).sort()), null, 1) + "\n");
  console.log(`blurbs: wrote ${ok}; ${Object.keys(out).length} overrides in ${FILE}`);
}
main();
