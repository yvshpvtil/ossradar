/**
 * Daily data job. Usage: npm run collect  (npx tsx scripts/collect.ts)
 *
 * 1. Queries the GitHub Search API for young AI/devtools repos (created in the last ~90 days)
 *    plus recently pushed popular repos in the same space.
 * 2. Writes data/snapshots/YYYY-MM-DD.json  (full_name -> stars).
 * 3. Computes 24h / 7d star deltas from prior snapshots. When there is no usable prior snapshot
 *    it falls back to a stars/age-in-days estimate and flags the value as estimated.
 * 4. Writes data/repos.json, which the Next.js site reads at build time.
 *
 * Auth: GITHUB_TOKEN env var, falling back to `gh auth token`.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { categorize } from "../lib/categories";
import type { HistoryPoint, Repo, RepoData, Snapshot } from "../lib/types";
import { summarize, summarizerId } from "./summarize";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const SNAPSHOT_DIR = path.join(DATA_DIR, "snapshots");
const SUMMARY_CACHE = path.join(DATA_DIR, "summaries.json");

const MAX_REPOS = 450;
const NEW_REPO_WINDOW_DAYS = 90;
const HISTORY_DAYS = 30;
const DAY_MS = 86_400_000;

// ---------- helpers ----------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);
}

function getToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execSync("gh auth token", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    throw new Error("No GitHub token: set GITHUB_TOKEN or log in with `gh auth login`.");
  }
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

// ---------- GitHub search ----------

interface SearchItem {
  full_name: string;
  name: string;
  owner: { login: string; avatar_url: string };
  html_url: string;
  homepage: string | null;
  description: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  pushed_at: string;
  archived: boolean;
  fork: boolean;
}

const token = getToken();

async function search(query: string, page = 1): Promise<SearchItem[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100&page=${page}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ossradar-collector",
      },
    });
    const remaining = Number(res.headers.get("x-ratelimit-remaining") ?? "1");
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? "0") * 1000;
    if (res.ok) {
      const body = (await res.json()) as { items: SearchItem[]; incomplete_results: boolean };
      if (remaining <= 1 && reset > Date.now()) {
        const wait = reset - Date.now() + 1000;
        console.log(`  rate limit exhausted, waiting ${Math.ceil(wait / 1000)}s`);
        await sleep(wait);
      }
      return body.items;
    }
    if (res.status === 403 || res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? "0") * 1000;
      const wait = Math.max(retryAfter, remaining === 0 ? reset - Date.now() + 1000 : 0, 15_000 * attempt);
      console.warn(`  ${res.status} on "${query}", retrying in ${Math.ceil(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    if (res.status === 422) {
      console.warn(`  422 for "${query}": ${await res.text()}`);
      return [];
    }
    throw new Error(`GitHub search failed (${res.status}): ${await res.text()}`);
  }
  console.warn(`  giving up on "${query}"`);
  return [];
}

function buildQueries(today: Date): { q: string; pages: number }[] {
  const createdSince = isoDate(new Date(today.getTime() - NEW_REPO_WINDOW_DAYS * DAY_MS));
  const pushedSince = isoDate(new Date(today.getTime() - 7 * DAY_MS));
  const young = (q: string, minStars = 25) => `${q} created:>${createdSince} stars:>=${minStars} archived:false`;
  const popular = (q: string) => `${q} pushed:>${pushedSince} stars:>=2000 archived:false`;

  const youngTopics = [
    "llm", "ai-agents", "agents", "agentic-ai", "mcp", "model-context-protocol", "mcp-server",
    "rag", "vector-database", "embeddings", "local-llm", "ollama", "coding-agent", "claude-code",
    "ai-coding", "llmops", "generative-ai", "ai", "devops", "kubernetes", "developer-tools", "cli",
    "self-hosted", "observability",
  ];
  const youngKeywords = ["mcp in:name,description", "agent in:name,description", "llm in:name,description", "\"claude code\" in:name,description,readme"];
  const popularTopics = ["llm", "ai-agents", "mcp", "rag", "local-llm", "coding-agent", "devops", "developer-tools"];

  return [
    ...youngTopics.map((t) => ({ q: young(`topic:${t}`), pages: ["llm", "ai", "ai-agents", "mcp"].includes(t) ? 2 : 1 })),
    ...youngKeywords.map((k) => ({ q: young(k, 40), pages: 2 })),
    ...popularTopics.map((t) => ({ q: popular(`topic:${t}`), pages: 1 })),
  ];
}

// ---------- deltas ----------

interface LoadedSnapshot {
  date: string;
  stars: Snapshot;
}

function loadSnapshots(before: string): LoadedSnapshot[] {
  if (!existsSync(SNAPSHOT_DIR)) return [];
  return readdirSync(SNAPSHOT_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.slice(0, 10))
    .filter((d) => d < before)
    .sort()
    .map((date) => ({ date, stars: readJson<Snapshot>(path.join(SNAPSHOT_DIR, `${date}.json`), {}) }));
}

interface Velocity {
  delta24h: number;
  delta7d: number;
  estimated24h: boolean;
  estimated7d: boolean;
}

function ageEstimate(stars: number, createdAt: string, now: Date): { perDay: number } {
  const ageDays = Math.max(1, (now.getTime() - Date.parse(createdAt)) / DAY_MS);
  return { perDay: stars / ageDays };
}

function computeVelocity(
  fullName: string,
  stars: number,
  createdAt: string,
  today: string,
  now: Date,
  prior: LoadedSnapshot[],
): Velocity {
  // Prior snapshots (newest first) that contain this repo, within the last 10 days.
  const points = prior
    .filter((s) => s.stars[fullName] !== undefined)
    .map((s) => ({ age: daysBetween(s.date, today), stars: s.stars[fullName] }))
    .filter((p) => p.age >= 1 && p.age <= 10)
    .sort((a, b) => a.age - b.age);

  const est = ageEstimate(stars, createdAt, now).perDay;
  let delta24h: number;
  let estimated24h: boolean;
  const newest = points[0];
  if (newest && newest.age === 1) {
    delta24h = stars - newest.stars;
    estimated24h = false;
  } else if (newest) {
    delta24h = Math.round((stars - newest.stars) / newest.age);
    estimated24h = true;
  } else {
    delta24h = Math.round(est);
    estimated24h = true;
  }

  let delta7d: number;
  let estimated7d: boolean;
  const weekAgo = points.find((p) => p.age === 7);
  const oldest = points[points.length - 1];
  if (weekAgo) {
    delta7d = stars - weekAgo.stars;
    estimated7d = false;
  } else if (oldest) {
    delta7d = Math.round(((stars - oldest.stars) / oldest.age) * 7);
    estimated7d = true;
  } else {
    delta7d = Math.round(Math.min(stars, est * 7));
    estimated7d = true;
  }
  return { delta24h, delta7d, estimated24h, estimated7d };
}

function buildHistory(fullName: string, stars: number, today: string, prior: LoadedSnapshot[]): HistoryPoint[] {
  const points = prior
    .filter((s) => daysBetween(s.date, today) <= HISTORY_DAYS && s.stars[fullName] !== undefined)
    .map((s) => ({ date: s.date, stars: s.stars[fullName] }));
  points.push({ date: today, stars });
  return points;
}

// ---------- main ----------

interface SummaryCacheEntry {
  hash: string;
  summarizer: string;
  text: string;
}

async function main() {
  const now = new Date();
  const today = isoDate(now);
  const queries = buildQueries(now);
  const found = new Map<string, SearchItem>();

  console.log(`Collecting for ${today} with ${queries.length} queries…`);
  for (const { q, pages } of queries) {
    for (let page = 1; page <= pages; page++) {
      const items = await search(q, page);
      let added = 0;
      for (const item of items) {
        if (item.fork || item.archived) continue;
        if (/^awesome[-_]?/i.test(item.name)) continue; // curated lists aren't tools
        if (!found.has(item.full_name)) added++;
        found.set(item.full_name, item);
      }
      console.log(`  [${found.size}] ${q} p${page}: ${items.length} results, ${added} new`);
      // Search API allows 30 req/min when authenticated.
      await sleep(2200);
      if (items.length < 100) break;
    }
  }

  const prior = loadSnapshots(today);
  console.log(`Found ${found.size} unique repos; ${prior.length} prior snapshot(s).`);

  const candidates = [...found.values()].map((item) => {
    const v = computeVelocity(item.full_name, item.stargazers_count, item.created_at, today, now, prior);
    return { item, v };
  });
  candidates.sort((a, b) => b.v.delta7d - a.v.delta7d || b.item.stargazers_count - a.item.stargazers_count);
  const selected = candidates.slice(0, MAX_REPOS);

  const summaryCache = readJson<Record<string, SummaryCacheEntry>>(SUMMARY_CACHE, {});
  const repos: Repo[] = [];
  let llmCalls = 0;
  for (const { item, v } of selected) {
    const topics = item.topics ?? [];
    const description = (item.description ?? "").trim();
    const category = categorize({ topics, description, name: item.name });
    const hash = createHash("sha1").update(`${description}|${topics.join(",")}|${category}`).digest("hex").slice(0, 12);
    const cached = summaryCache[item.full_name];
    let oneLiner: string;
    if (summarizerId !== "template" && cached && cached.hash === hash && cached.summarizer === summarizerId) {
      oneLiner = cached.text;
    } else {
      oneLiner = await summarize({
        fullName: item.full_name,
        description,
        topics,
        language: item.language,
        category,
        stars: item.stargazers_count,
        delta7d: v.delta7d,
      });
      if (summarizerId !== "template") {
        llmCalls++;
        summaryCache[item.full_name] = { hash, summarizer: summarizerId, text: oneLiner };
      }
    }

    repos.push({
      fullName: item.full_name,
      owner: item.owner.login,
      name: item.name,
      url: item.html_url,
      homepage: item.homepage || null,
      description,
      language: item.language,
      topics,
      stars: item.stargazers_count,
      forks: item.forks_count,
      createdAt: item.created_at,
      pushedAt: item.pushed_at,
      ownerAvatar: item.owner.avatar_url,
      category,
      oneLiner,
      ...v,
      velocityEstimated: v.estimated24h || v.estimated7d,
      history: buildHistory(item.full_name, item.stargazers_count, today, prior),
    });
  }

  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  // Snapshot every repo we saw (not just the capped set) so future deltas have more coverage.
  const snapshot: Snapshot = {};
  for (const name of [...found.keys()].sort()) snapshot[name] = found.get(name)!.stargazers_count;
  writeFileSync(path.join(SNAPSHOT_DIR, `${today}.json`), `${JSON.stringify(snapshot, null, 1)}\n`);

  const output: RepoData = {
    generatedAt: now.toISOString(),
    snapshotDate: today,
    snapshotCount: prior.length + 1,
    repos,
  };
  writeFileSync(path.join(DATA_DIR, "repos.json"), `${JSON.stringify(output, null, 1)}\n`);

  // Only keep cache entries for repos we still track.
  const tracked = new Set(repos.map((r) => r.fullName));
  const prunedCache = Object.fromEntries(Object.entries(summaryCache).filter(([k]) => tracked.has(k)));
  writeFileSync(SUMMARY_CACHE, `${JSON.stringify(prunedCache, null, 1)}\n`);

  const estimated = repos.filter((r) => r.velocityEstimated).length;
  console.log(
    `Wrote ${repos.length} repos (${estimated} with estimated velocity, ${llmCalls} LLM summaries) and snapshot ${today}.json`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
