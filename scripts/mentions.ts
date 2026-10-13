/**
 * Hacker News mentions per repo, via the free HN Algolia search API (no key needed).
 * Counts HN stories whose link points at the repo (github.com/owner/name...), and keeps the top one.
 * Writes data/mentions.json. Refreshes at most MENTIONS_LIMIT repos per run, stalest first,
 * each at most every 12h, so hourly runs stay small. Reddit's JSON API blocks unauthenticated
 * server requests (403), so it is not used.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { RepoData } from "../lib/types";

type Mention = {
  checkedAt: string;
  count: number;
  points: number;
  top: { id: string; title: string; points: number; comments: number; date: string } | null;
};
type MentionsFile = { updatedAt: string; repos: Record<string, Mention> };

const FILE = "data/mentions.json";
const LIMIT = Number(process.env.MENTIONS_LIMIT ?? 120);
const STALE_MS = 12 * 3600_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function lookup(fullName: string): Promise<Mention> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(fullName)}&restrictSearchableAttributes=url&tags=story&hitsPerPage=100`;
  const res = await fetch(url, { headers: { "User-Agent": "ossradar-mentions" } });
  if (!res.ok) throw new Error(`HN ${res.status}`);
  const body = (await res.json()) as { hits: { objectID: string; title: string; url: string | null; points: number | null; num_comments: number | null; created_at: string }[] };
  const re = new RegExp(`^https?://(www\\.)?github\\.com/${fullName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([/#?]|$)`, "i");
  const hits = body.hits.filter((h) => h.url && re.test(h.url));
  hits.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const t = hits[0];
  return {
    checkedAt: new Date().toISOString(),
    count: hits.length,
    points: hits.reduce((n, h) => n + (h.points ?? 0), 0),
    top: t ? { id: t.objectID, title: t.title, points: t.points ?? 0, comments: t.num_comments ?? 0, date: t.created_at.slice(0, 10) } : null,
  };
}

async function main() {
  const data = JSON.parse(readFileSync("data/repos.json", "utf8")) as RepoData;
  const file: MentionsFile = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { updatedAt: "", repos: {} };
  const now = Date.now();
  const tracked = new Set(data.repos.map((r) => r.fullName));
  for (const k of Object.keys(file.repos)) if (!tracked.has(k)) delete file.repos[k];
  const due = data.repos
    .filter((r) => !file.repos[r.fullName] || now - Date.parse(file.repos[r.fullName].checkedAt) > STALE_MS)
    .sort((a, b) => (file.repos[a.fullName] ? 1 : 0) - (file.repos[b.fullName] ? 1 : 0) || b.delta24h - a.delta24h)
    .slice(0, LIMIT);
  let ok = 0, failed = 0;
  for (const r of due) {
    try {
      file.repos[r.fullName] = await lookup(r.fullName);
      ok++;
    } catch (e) {
      failed++;
      if (failed >= 5) { console.warn("Too many HN failures, stopping:", e); break; }
    }
    await sleep(250);
  }
  file.updatedAt = new Date().toISOString();
  writeFileSync(FILE, JSON.stringify(file, null, 0) + "\n");
  const withHits = Object.values(file.repos).filter((m) => m.count > 0).length;
  console.log(`HN mentions: refreshed ${ok}, failed ${failed}, ${withHits}/${Object.keys(file.repos).length} repos have HN posts.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
