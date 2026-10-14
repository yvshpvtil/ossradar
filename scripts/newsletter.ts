/**
 * Daily newsletter: builds an email of today's fastest-growing repos from
 * data/repos.json and sends it as a Kit broadcast to all subscribers.
 *
 *   DRY_RUN=1   -> write out/newsletter.html and do not call Kit
 *   KIT_API_KEY -> Kit v4 API key (required for a real send)
 *
 * Idempotent: skips if a broadcast with today's subject already exists in Kit.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

type Repo = {
  fullName: string; url: string; description?: string; oneLiner?: string;
  language?: string; stars: number; delta24h?: number; category?: string;
};

const SITE = "https://ossradar.net";
const TOP = Number(process.env.NEWSLETTER_TOP ?? 10);
const data = JSON.parse(readFileSync("data/repos.json", "utf8")) as { snapshotDate: string; repos: Repo[] };
const date = data.snapshotDate;
const repos = [...data.repos].filter((r) => (r.delta24h ?? 0) > 0)
  .sort((a, b) => (b.delta24h ?? 0) - (a.delta24h ?? 0)).slice(0, TOP);

const esc = (s = "") => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const fmt = (n: number) => n.toLocaleString("en-US");
const nice = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const subject = `OSS Radar daily: top ${repos.length} fast-growing repos — ${date}`;

const items = repos.map((r, i) => `
<tr><td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
  <div style="font-size:13px;color:#6b7280;">#${i + 1}${r.language ? " · " + esc(r.language) : ""}</div>
  <a href="${SITE}/repo/${esc(r.fullName)}" style="font-size:17px;font-weight:600;color:#111827;text-decoration:none;">${esc(r.fullName)}</a>
  <div style="font-size:15px;color:#374151;margin:6px 0;line-height:1.5;">${esc(r.description || r.oneLiner || "")}</div>
  <div style="font-size:13px;color:#059669;font-weight:600;">+${fmt(r.delta24h ?? 0)} stars in the last 24 hours <span style="color:#6b7280;font-weight:400;">· ${fmt(r.stars)} total</span></div>
</td></tr>`).join("");

const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827;">
<h1 style="font-size:22px;margin:0 0 4px;">OSS Radar — Daily</h1>
<div style="font-size:14px;color:#6b7280;margin-bottom:12px;">${nice}</div>
<p style="font-size:15px;line-height:1.5;color:#374151;">The open-source projects on GitHub that gained the most stars (GitHub's "bookmark/like" count, a rough signal of developer interest) over the past 24 hours.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
<p style="font-size:15px;margin-top:20px;"><a href="${SITE}" style="color:#2563eb;">See the full live rankings on ossradar.net →</a></p>
<p style="font-size:12px;color:#9ca3af;">Some 24-hour figures are estimated for repos we started tracking recently.</p>
</div>`;

async function kit(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.kit.com/v4${path}`, {
    ...init,
    headers: { "X-Kit-Api-Key": process.env.KIT_API_KEY!, "Content-Type": "application/json", Accept: "application/json" },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Kit ${path} ${res.status}: ${body}`);
  return JSON.parse(body);
}

async function main() {
  if (repos.length === 0) { console.log("No growing repos; skipping."); return; }
  mkdirSync("out", { recursive: true });
  writeFileSync("out/newsletter.html", html);
  console.log(`Subject: ${subject}\nRepos: ${repos.map((r) => r.fullName).join(", ")}`);
  if (process.env.DRY_RUN) { console.log("DRY_RUN: wrote out/newsletter.html, not sending."); return; }
  if (!process.env.KIT_API_KEY) throw new Error("KIT_API_KEY missing");

  const existing = await kit("/broadcasts?per_page=50");
  if (existing.broadcasts?.some((b: { subject?: string }) => b.subject?.includes(date))) {
    console.log(`Broadcast for ${date} already exists; skipping.`); return;
  }
  const res = await kit("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      subject, content: html, preview_text: `Today's top: ${repos[0].fullName} (+${fmt(repos[0].delta24h ?? 0)} stars)`,
      description: `Daily digest ${date}`, public: false,
      send_at: new Date(Date.now() + 2 * 60_000).toISOString(),
      published_at: new Date().toISOString(),
      // No subscriber_filter: Kit then sends to all subscribers (the API only accepts segment/tag filters).
    }),
  });
  console.log(`Scheduled Kit broadcast ${res.broadcast?.id} for ${res.broadcast?.send_at}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
