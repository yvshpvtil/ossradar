/**
 * IndexNow ping (Bing, Yandex, Seznam, Naver... share submissions). Free, no account needed:
 * the key file public/<key>.txt proves ownership.
 *   - every run: hub pages + repo pages first seen today + the newest /daily archive pages,
 *     limited to URLs in the live sitemap (so dropped/retired repos are never pinged)
 *   - INDEXNOW_FULL=1 (or the 00:xx UTC run): every sitemap URL
 * Run after the deploy containing the new data is live.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const KEY = "71ab7b34e1160ea6250fdd8d63e9a2c7";
const HOST = "ossradar.net";
const SITE = `https://${HOST}`;

type SitemapEntry = { loc: string; lastmod?: string };

async function sitemapEntries(): Promise<SitemapEntry[]> {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap ${res.status}`);
  return [...(await res.text()).matchAll(/<url>([\s\S]*?)<\/url>/g)].flatMap((m) => {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) return [];
    return [{ loc, lastmod: m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] }];
  });
}

/** Trailing-slash-insensitive key so "https://ossradar.net" and "https://ossradar.net/" match. */
const norm = (u: string) => u.replace(/\/+$/, "");

async function main() {
  const data = JSON.parse(readFileSync(path.join(process.cwd(), "data", "repos.json"), "utf8")) as {
    snapshotDate: string;
    repos: { owner: string; name: string; firstSeen?: string }[];
  };
  const full = process.env.INDEXNOW_FULL === "1" || new Date().getUTCHours() === 0;
  const entries = await sitemapEntries();
  let urls: string[];
  if (full) {
    urls = entries.map((e) => e.loc);
  } else {
    const live = new Map(entries.map((e) => [norm(e.loc), e.loc]));
    const hubs = ["", "/new", "/daily", "/trending/github-repos-today", "/trending/ai-repos-this-week", "/trending/new-ai-repos"];
    const fresh = data.repos.filter((r) => r.firstSeen === data.snapshotDate).map((r) => `/repo/${r.owner}/${r.name}`);
    // Newest daily archive pages (yesterday's page is finalised just after 00:00 UTC).
    const cutoff = Date.now() - 48 * 3600 * 1000;
    const daily = entries
      .filter((e) => /\/daily\/\d{4}-\d{2}-\d{2}$/.test(e.loc) && e.lastmod && Date.parse(e.lastmod) >= cutoff)
      .map((e) => e.loc);
    const wanted = [...[...hubs, ...fresh].map((p) => `${SITE}${p}`), ...daily];
    urls = wanted.flatMap((u) => live.get(norm(u)) ?? []);
    const skipped = wanted.length - urls.length;
    if (skipped) console.log(`IndexNow: skipped ${skipped} URL(s) not in the sitemap (dropped or retired)`);
  }
  urls = [...new Set(urls)].slice(0, 10_000);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
  });
  console.log(`IndexNow: ${urls.length} URLs (${full ? "full" : "incremental"}) -> HTTP ${res.status} ${await res.text()}`);
  if (res.status >= 400 && res.status !== 429) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
