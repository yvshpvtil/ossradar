/**
 * Enrich repos with README-derived details (data/details/<owner>__<repo>.json).
 * Only processes repos without a details file (or from an older DETAILS_VERSION), so it is
 * cheap enough for the hourly job. Env:
 *   ENRICH_LIMIT  max repos per run (default 25)   ENRICH_TOP  only consider the top N by 24h gain
 *   ENRICH_CONCURRENCY (default 4)   ENRICH_UPGRADE=1  re-run repos last done by the heuristic
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readmeBlurb, repoBlurb } from "../lib/blurb";
import path from "node:path";
import type { RepoData, RepoDetails } from "../lib/types";
import { DETAILS_VERSION, detailsExtractorId, extractDetails } from "./summarize";

const DIR = path.join(process.cwd(), "data", "details");
export const detailsFile = (fullName: string) => path.join(DIR, `${fullName.replace("/", "__")}.json`);

async function fetchReadme(fullName: string): Promise<string> {
  if (!process.env.GITHUB_TOKEN && process.env.ENRICH_USE_GH === "1") {
    // Local backfills: go through the logged-in gh CLI instead of the anonymous rate limit.
    const { execFile } = await import("node:child_process");
    const out = await new Promise<{ status: number; stdout: string; stderr: string }>((resolve) =>
      execFile("gh", ["api", "-H", "Accept: application/vnd.github.raw+json", `repos/${fullName}/readme`], { maxBuffer: 20 * 1024 * 1024 }, (e, stdout, stderr) =>
        resolve({ status: e ? 1 : 0, stdout, stderr }),
      ),
    );
    if (out.status !== 0) {
      if (/404|Not Found/.test(out.stderr + out.stdout)) return "";
      throw new Error(`README ${fullName}: ${out.stderr.slice(0, 120)}`);
    }
    return out.stdout;
  }
  const headers: Record<string, string> = { Accept: "application/vnd.github.raw+json", "User-Agent": "ossradar" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, { headers });
  if (res.status === 404) return "";
  if (!res.ok) throw new Error(`README ${fullName}: HTTP ${res.status}`);
  return res.text();
}

async function main() {
  mkdirSync(DIR, { recursive: true });
  const data = JSON.parse(readFileSync(path.join(process.cwd(), "data", "repos.json"), "utf8")) as RepoData;
  const limit = Number(process.env.ENRICH_LIMIT ?? 25);
  const top = Number(process.env.ENRICH_TOP ?? data.repos.length);
  const upgrade = process.env.ENRICH_UPGRADE === "1" && detailsExtractorId !== "heuristic";
  const pool = [...data.repos].sort((a, b) => b.delta24h - a.delta24h || b.stars - a.stars).slice(0, top);
  const todo = pool
    .filter((r) => {
      const f = detailsFile(r.fullName);
      if (!existsSync(f)) return true;
      const d = JSON.parse(readFileSync(f, "utf8")) as RepoDetails;
      // Also (re)process repos with no usable description whose details predate readmeSummary.
      return d.version !== DETAILS_VERSION || (upgrade && d.extractor === "heuristic") || (d.readmeSummary === undefined && !repoBlurb(r));
    })
    .slice(0, limit);
  console.log(`enrich: ${todo.length} repos to process with ${detailsExtractorId}`);
  let i = 0;
  let done = 0;
  const worker = async () => {
    while (i < todo.length) {
      const r = todo[i++];
      try {
        const readme = await fetchReadme(r.fullName);
        const { details, extractor } = await extractDetails({ fullName: r.fullName, description: r.description, readme });
        const out: RepoDetails = {
          fullName: r.fullName,
          ...details,
          readmeSummary: readmeBlurb(readme),
          extractor,
          readmeHash: createHash("sha1").update(readme).digest("hex").slice(0, 12),
          version: DETAILS_VERSION,
          generatedAt: new Date().toISOString(),
        };
        writeFileSync(detailsFile(r.fullName), `${JSON.stringify(out, null, 1)}\n`);
        done++;
        console.log(`  ✓ ${r.fullName} (${extractor})`);
      } catch (err) {
        console.warn(`  ✗ ${r.fullName}: ${(err as Error).message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Number(process.env.ENRICH_CONCURRENCY ?? 4) }, worker));
  console.log(`enrich: wrote ${done} details files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
