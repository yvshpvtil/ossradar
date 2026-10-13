/**
 * Release activity per repo: latest GitHub release (tag, date, link) via the GitHub REST API.
 * Writes data/activity.json. At most ACTIVITY_LIMIT repos per run, stalest first, each every 12h.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import type { RepoData } from "../lib/types";

type Activity = { checkedAt: string; release: { tag: string; name: string; date: string; url: string } | null };
const FILE = "data/activity.json";
const LIMIT = Number(process.env.ACTIVITY_LIMIT ?? 150);
const STALE_MS = 12 * 3600_000;
const token = process.env.GITHUB_TOKEN || execSync("gh auth token").toString().trim();

async function latestRelease(fullName: string): Promise<Activity["release"]> {
  const res = await fetch(`https://api.github.com/repos/${fullName}/releases/latest`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "ossradar-activity" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const r = (await res.json()) as { tag_name: string; name: string | null; published_at: string; html_url: string };
  return { tag: r.tag_name, name: r.name || r.tag_name, date: r.published_at, url: r.html_url };
}

async function main() {
  const data = JSON.parse(readFileSync("data/repos.json", "utf8")) as RepoData;
  const file: { updatedAt: string; repos: Record<string, Activity> } = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { updatedAt: "", repos: {} };
  const tracked = new Set(data.repos.map((r) => r.fullName));
  for (const k of Object.keys(file.repos)) if (!tracked.has(k)) delete file.repos[k];
  const now = Date.now();
  const due = data.repos
    .filter((r) => !file.repos[r.fullName] || now - Date.parse(file.repos[r.fullName].checkedAt) > STALE_MS)
    .sort((a, b) => (file.repos[a.fullName] ? 1 : 0) - (file.repos[b.fullName] ? 1 : 0) || b.delta24h - a.delta24h)
    .slice(0, LIMIT);
  let ok = 0, failed = 0;
  for (const r of due) {
    try {
      file.repos[r.fullName] = { checkedAt: new Date().toISOString(), release: await latestRelease(r.fullName) };
      ok++;
    } catch (e) {
      if (++failed >= 5) { console.warn("Too many failures, stopping:", e); break; }
    }
  }
  file.updatedAt = new Date().toISOString();
  writeFileSync(FILE, JSON.stringify(file) + "\n");
  console.log(`Activity: refreshed ${ok}, failed ${failed}; ${Object.values(file.repos).filter((a) => a.release).length} repos have releases.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
