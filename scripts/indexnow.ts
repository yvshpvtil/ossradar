/**
 * IndexNow ping (Bing, Yandex, Seznam, Naver... share submissions). Free, no account needed:
 * the key file public/<key>.txt proves ownership.
 *   - every run: hub pages + repo pages first seen today
 *   - INDEXNOW_FULL=1 (or the 00:xx UTC run): every sitemap URL
 * Run after the deploy containing the new data is live.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const KEY = "71ab7b34e1160ea6250fdd8d63e9a2c7";
const HOST = "ossradar.net";
const SITE = `https://${HOST}`;

async function sitemapUrls(): Promise<string[]> {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap ${res.status}`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const data = JSON.parse(readFileSync(path.join(process.cwd(), "data", "repos.json"), "utf8")) as {
    snapshotDate: string;
    repos: { owner: string; name: string; firstSeen?: string }[];
  };
  const full = process.env.INDEXNOW_FULL === "1" || new Date().getUTCHours() === 0;
  let urls: string[];
  if (full) {
    urls = await sitemapUrls();
  } else {
    const hubs = ["", "/new", "/daily", "/trending/github-repos-today", "/trending/ai-repos-this-week", "/trending/new-ai-repos"];
    const fresh = data.repos.filter((r) => r.firstSeen === data.snapshotDate).map((r) => `/repo/${r.owner}/${r.name}`);
    urls = [...hubs, ...fresh].map((p) => `${SITE}${p}`);
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
