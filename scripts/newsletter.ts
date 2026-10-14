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
import { execFileSync } from "node:child_process";
import { cleanBlurb, readmeBlurb, repoBlurb } from "../lib/blurb";
import { getActiveSponsor } from "../lib/sponsors";

type Repo = {
  fullName: string; owner: string; name?: string; topics?: string[]; url: string; description?: string; oneLiner?: string;
  language?: string | null; stars: number; delta24h?: number; delta7d?: number; category?: string; createdAt?: string;
  estimated24h?: boolean; prevRank?: number | null;
};
type Mention = { count: number; points: number; top: { id: string; title: string; points: number; comments: number; date: string } | null };

const SITE = "https://ossradar.net";
const TOP = Number(process.env.NEWSLETTER_TOP ?? 10);
/** First issue went out 2026-10-14; the issue number counts days from there. */
const FIRST_ISSUE = "2026-10-14";
const data = JSON.parse(readFileSync("data/repos.json", "utf8")) as { snapshotDate: string; generatedAt: string; repos: Repo[] };
const mentions = (() => {
  try { return (JSON.parse(readFileSync("data/mentions.json", "utf8")) as { repos: Record<string, Mention> }).repos; } catch { return {} as Record<string, Mention>; }
})();
const date = data.snapshotDate;
const DAY = 86_400_000;
const nowMs = Date.parse(data.generatedAt);
const only = process.env.NEWSLETTER_REPOS?.split(",");
const ranked = [...data.repos].filter((r) => (r.delta24h ?? 0) > 0).sort((a, b) => (b.delta24h ?? 0) - (a.delta24h ?? 0) || b.stars - a.stars);
const repos = only ? only.map((n) => data.repos.find((r) => r.fullName === n)!).filter(Boolean) : ranked.slice(0, TOP);
const issueNo = Math.max(1, Math.round((Date.parse(date) - Date.parse(FIRST_ISSUE)) / DAY) + 1);

const esc = (s = "") => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const fmt = (n: number) => n.toLocaleString("en-US");
const short = (n: number) => (n >= 10_000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k` : fmt(n));
const nice = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const niceShort = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const nameOf = (r: Repo) => r.name ?? r.fullName.split("/")[1];
const repoUrl = (r: Repo) => `${SITE}/repo/${r.fullName}`;
const ageDays = (r: Repo) => (r.createdAt ? Math.max(1, Math.round((nowMs - Date.parse(r.createdAt)) / DAY)) : null);
const CAT: Record<string, string> = { "ai-agents": "AI agents", "llm-tooling": "LLM tooling", mcp: "MCP", "coding-agents": "Coding agents", "rag-vector": "RAG / vector", "local-llms": "Local LLMs", devops: "DevOps", other: "Dev tools" };

const lead = repos[0];
const subject = lead
  ? `${nameOf(lead)} gained ${fmt(lead.delta24h ?? 0)} GitHub stars in a day · OSS Radar ${date}`
  : `OSS Radar daily — ${date}`;
const previewText = lead
  ? `Plus ${repos.slice(1, 3).map(nameOf).join(", ")} and ${Math.max(0, repos.length - 3)} more open-source projects developers starred most in the last 24 hours.`
  : "";

/** Optional sections, only from real data. */
const shown = new Set(repos.map((r) => r.fullName));
const newThisWeek = ranked.filter((r) => !shown.has(r.fullName) && (ageDays(r) ?? 999) <= 7 && !r.estimated24h).slice(0, 3);
const hnPick = (() => {
  const cutoff = Date.parse(date) - 14 * DAY;
  return ranked.slice(0, 60)
    .map((r) => ({ r, m: mentions[r.fullName] }))
    .filter((x) => x.m?.top && Date.parse(x.m.top.date) >= cutoff && x.m.top.points >= 20)
    .sort((a, b) => b.m!.top!.points - a.m!.top!.points)[0] ?? null;
})();

/** Hero "why it matters": computed facts only. */
function heroWhy(r: Repo): string {
  const age = ageDays(r);
  const parts = [`It gained more stars in the last 24 hours than any other project OSS Radar tracks.`];
  if (age && !r.estimated24h) {
    const x = (r.delta24h ?? 0) / (r.stars / age);
    if (x >= 1.5) parts.push(`That is about ${x.toFixed(1)}× its average daily pace since it was created ${age} days ago.`);
  }
  const m = mentions[r.fullName];
  if (m?.top && m.top.points >= 20) parts.push(`It was also discussed on Hacker News (${fmt(m.top.points)} points).`);
  return parts.join(" ");
}

/** Facts handed to the intro writer (and used for the template fallback). */
const facts = () => ({
  date: nice,
  tracked: data.repos.length,
  top: repos.slice(0, 5).map((r) => ({ repo: r.fullName, category: CAT[r.category ?? "other"], starsLast24h: r.delta24h ?? 0, totalStars: r.stars, language: r.language ?? null })),
  starsGainedByTop10: repos.reduce((n, r) => n + (r.delta24h ?? 0), 0),
  categoriesInTop10: [...new Set(repos.map((r) => CAT[r.category ?? "other"]))],
});

function templateIntro(): string {
  const f = facts();
  const [a, b] = repos;
  const c3 = f.categoriesInTop10.slice(0, 3);
  const cats = c3.length > 1 ? `${c3.slice(0, -1).join(", ")} and ${c3[c3.length - 1]}` : c3[0];
  return `${esc(a.fullName)} led the day with ${fmt(a.delta24h ?? 0)} new GitHub stars${b ? `, well ahead of ${esc(b.fullName)} (${fmt(b.delta24h ?? 0)})` : ""}. ` +
    `Together, today's top ${repos.length} picked up ${fmt(f.starsGainedByTop10)} stars, with ${esc(cats)} projects doing most of the climbing.`;
}

/** 2-3 sentence editorial via the Claude Code CLI when available; every number it uses must come from the facts, else template. */
function llmIntro(): string | null {
  if (process.env.NEWSLETTER_LLM === "0") return null;
  const f = facts();
  try {
    const out = execFileSync(process.env.CLAUDE_BIN || "claude", ["-p",
      `Write a 2-3 sentence (max 55 words) "Today in open source" intro for a daily email about fast-rising GitHub projects. Plain English for developers, friendly but not hypey, no emojis, no exclamation marks, no markdown, no dates. Mention at most two repos by name, and pick out one interesting pattern (e.g. which kind of project dominates). ` +
      `Use ONLY these facts; do not add numbers, claims, or reasons that are not in the facts. "Stars" are GitHub bookmarks, a rough signal of developer interest. Output only the intro text.\n\nFacts (JSON):\n${JSON.stringify(f)}`],
      { encoding: "utf8", timeout: 90_000, stdio: ["ignore", "pipe", "ignore"] }).trim().replace(/\s+/g, " ");
    if (!out || out.split(/\s+/).length > 70 || /[*#`]/.test(out)) return null;
    const known = new Set(JSON.stringify(f).match(/\d[\d,.]*/g)!.map((n) => n.replace(/,/g, "")));
    const used = (out.match(/\d[\d,.]*\d|\d/g) ?? []).map((n) => n.replace(/,/g, ""));
    const shortOk = (n: string) => [...known].some((k) => { const v = Number(k); return v >= 1000 && (n === String(Math.round(v / 1000)) || n === (v / 1000).toFixed(1)); });
    if (used.some((n) => !known.has(n) && !shortOk(n) && !(Number(n) <= 10))) return null;
    return esc(out);
  } catch { return null; }
}

// ---------- email building blocks (table layout, inline styles) ----------
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const C = { ink: "#18181b", body: "#3f3f46", muted: "#71717a", line: "#e4e4e7", bg: "#f4f4f5", card: "#ffffff", brand: "#4f46e5", brandDark: "#1e1b4b", green: "#047857", greenBg: "#ecfdf5" };

const chip = (text: string, tone: "green" | "plain" = "plain") =>
  `<span style="display:inline-block;margin:0 6px 6px 0;padding:3px 9px;border-radius:999px;font:600 12px/18px ${FONT};${tone === "green" ? `background:${C.greenBg};color:${C.green};border:1px solid #a7f3d0;` : `background:#f4f4f5;color:${C.body};border:1px solid ${C.line};`}">${text}</span>`;

const chips = (r: Repo, withTotal = true) =>
  chip(`▲ +${fmt(r.delta24h ?? 0)} today${r.estimated24h ? "*" : ""}`, "green") +
  (withTotal ? chip(`★ ${short(r.stars)} total`) : "") +
  (r.language ? chip(esc(r.language)) : "") +
  chip(esc(CAT[r.category ?? "other"] ?? "Dev tools"));

const button = (href: string, label: string, primary: boolean) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:0 8px 8px 0;"><tr>
<td bgcolor="${primary ? C.brand : "#ffffff"}" style="border-radius:8px;${primary ? "" : `border:1px solid #d4d4d8;`}">
<a href="${esc(href)}" style="display:inline-block;padding:10px 16px;font:600 14px/20px ${FONT};color:${primary ? "#ffffff" : C.ink};text-decoration:none;border-radius:8px;">${label}</a>
</td></tr></table>`;

const section = (inner: string, pad = "24px 28px") => `<tr><td bgcolor="${C.card}" style="background:${C.card};padding:${pad};">${inner}</td></tr>`;
const divider = () => `<tr><td bgcolor="${C.card}" style="background:${C.card};padding:0 28px;"><div style="height:1px;line-height:1px;font-size:0;background:${C.line};">&nbsp;</div></td></tr>`;
const eyebrow = (t: string, color = C.brand) => `<div style="font:700 11px/16px ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${color};margin:0 0 10px;">${t}</div>`;

const sponsorHtml = () => {
  const s = getActiveSponsor(new Date());
  if (!s) return "";
  const logo = s.logo ? `<img src="${esc(s.logo)}" width="20" height="20" alt="" style="vertical-align:middle;border-radius:4px;margin-right:8px;border:0;">` : "";
  return section(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fcd34d;border-radius:10px;" bgcolor="#fffbeb"><tr><td style="padding:12px 16px;font:14px/21px ${FONT};color:${C.ink};">
<div style="font:700 10px/14px ${FONT};letter-spacing:.12em;text-transform:uppercase;color:#92400e;margin-bottom:4px;">Sponsor</div>
<a href="${esc(s.url)}" rel="sponsored" style="color:${C.ink};text-decoration:none;">${logo}<strong>${esc(s.name)}</strong> — ${esc(s.tagline)} <span style="color:#92400e;">→</span></a>
</td></tr></table>`, "16px 28px 0");
};

function buildHtml(blurbs: Map<string, string>, intro: string): string {
  const [hero, ...rest] = repos;
  const also = rest.slice(0, 5);
  const quick = rest.slice(5);
  const b = (r: Repo) => esc(blurbs.get(r.fullName) ?? "");
  const anyEst = repos.some((r) => r.estimated24h);

  const heroHtml = section(`
${eyebrow("Repo of the day")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #c7d2fe;border-radius:14px;" bgcolor="#eef2ff"><tr><td style="padding:22px 22px 14px;">
<div style="font:500 14px/20px ${FONT};color:${C.muted};">${esc(hero.owner)} /</div>
<a href="${repoUrl(hero)}" style="font:800 26px/32px ${FONT};color:${C.ink};text-decoration:none;word-break:break-word;">${esc(nameOf(hero))}</a>
<p style="margin:10px 0 14px;font:16px/24px ${FONT};color:${C.body};">${b(hero)}</p>
<div style="margin:0 0 8px;">${chips(hero)}</div>
<p style="margin:6px 0 16px;font:14px/21px ${FONT};color:${C.body};"><strong style="color:${C.ink};">Why it matters:</strong> ${esc(heroWhy(hero))}</p>
${button(repoUrl(hero), "View on OSS Radar", true)}${button(hero.url, "Open on GitHub", false)}
</td></tr></table>`, "8px 28px 24px");

  const alsoHtml = also.length ? section(`
${eyebrow("Also rising")}
${also.map((r, i) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:12px;margin:0 0 12px;" bgcolor="#ffffff"><tr>
<td width="44" valign="top" style="padding:16px 0 14px 16px;font:800 20px/26px ${MONO};color:#a1a1aa;">${i + 2}</td>
<td valign="top" style="padding:14px 16px 10px 8px;">
<a href="${repoUrl(r)}" style="font:700 17px/24px ${FONT};color:${C.ink};text-decoration:none;word-break:break-word;"><span style="font-weight:500;color:${C.muted};">${esc(r.owner)}/</span>${esc(nameOf(r))}</a>
<p style="margin:4px 0 10px;font:14px/21px ${FONT};color:${C.body};">${b(r)}</p>
<div>${chips(r)}</div>
</td></tr></table>`).join("")}`, "0 28px 12px") : "";

  const quickHtml = quick.length ? section(`
${eyebrow("Quick hits")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${quick.map((r, i) => `<tr>
<td width="30" valign="top" style="padding:10px 0;border-top:1px solid ${C.line};font:700 14px/21px ${MONO};color:#a1a1aa;">${i + 7}</td>
<td valign="top" style="padding:10px 0;border-top:1px solid ${C.line};font:14px/21px ${FONT};color:${C.body};">
<a href="${repoUrl(r)}" style="font-weight:700;color:${C.ink};text-decoration:none;word-break:break-word;">${esc(r.fullName)}</a>
<span style="color:${C.green};font-weight:600;white-space:nowrap;">&nbsp;+${fmt(r.delta24h ?? 0)}${r.estimated24h ? "*" : ""}</span><br>${b(r)}
</td></tr>`).join("")}
</table>`, "4px 28px 20px") : "";

  const newHtml = newThisWeek.length ? divider() + section(`
${eyebrow("New this week", C.green)}
<p style="margin:0 0 10px;font:13px/19px ${FONT};color:${C.muted};">Created in the last 7 days and already gaining fast.</p>
${newThisWeek.map((r) => `<p style="margin:0 0 10px;font:14px/21px ${FONT};color:${C.body};"><a href="${repoUrl(r)}" style="font-weight:700;color:${C.ink};text-decoration:none;">${esc(r.fullName)}</a> <span style="color:${C.muted};">· ${ageDays(r)} day${ageDays(r) === 1 ? "" : "s"} old · ${fmt(r.stars)} stars</span><span style="color:${C.green};font-weight:600;"> · +${fmt(r.delta24h ?? 0)} today</span><br>${b(r) || esc(r.description ?? "")}</p>`).join("")}`, "20px 28px 12px") : "";

  const hnHtml = hnPick ? divider() + section(`
${eyebrow("On Hacker News", "#c2410c")}
<p style="margin:0;font:14px/21px ${FONT};color:${C.body};"><a href="https://news.ycombinator.com/item?id=${esc(hnPick.m!.top!.id)}" style="font-weight:700;color:${C.ink};text-decoration:none;">“${esc(hnPick.m!.top!.title)}”</a><br>
<span style="color:${C.muted};">${fmt(hnPick.m!.top!.points)} points · ${fmt(hnPick.m!.top!.comments)} comments on Hacker News, the tech discussion site · about </span><a href="${repoUrl(hnPick.r)}" style="color:${C.brand};text-decoration:none;font-weight:600;">${esc(hnPick.r.fullName)}</a></p>`, "20px 28px 20px") : "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(previewText)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bg}" style="background:${C.bg};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;border:1px solid ${C.line};">
<tr><td bgcolor="${C.brandDark}" style="background:${C.brandDark};padding:22px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle" style="font:800 22px/28px ${FONT};color:#ffffff;"><span style="color:#a5b4fc;">◉</span>&nbsp;OSS&nbsp;Radar</td>
<td valign="middle" align="right" style="font:600 12px/16px ${FONT};color:#c7d2fe;white-space:nowrap;">Issue #${issueNo}<br><span style="font-weight:400;">${esc(niceShort)}</span></td>
</tr></table>
<div style="margin-top:10px;font:14px/20px ${FONT};color:#e0e7ff;">The open-source projects developers starred most in the last 24 hours.</div>
</td></tr>
${sponsorHtml()}
${section(`
${eyebrow("Today in open source")}
<p style="margin:0;font:16px/25px ${FONT};color:${C.ink};">${intro}</p>
<p style="margin:10px 0 0;font:12px/18px ${FONT};color:${C.muted};">${esc(nice)} · Stars are GitHub's “bookmark” button, a rough signal of how many developers are paying attention.</p>`, "24px 28px 16px")}
${heroHtml}
${alsoHtml}
${quickHtml}
${newHtml}
${hnHtml}
${section(`<div style="text-align:center;">${button(SITE, "See the full live leaderboard →", true)}</div>`, "8px 28px 24px")}
<tr><td bgcolor="#fafafa" style="background:#fafafa;padding:20px 28px;border-top:1px solid ${C.line};font:12px/19px ${FONT};color:${C.muted};">
<p style="margin:0 0 8px;"><strong style="color:${C.body};">Know someone who'd like this?</strong> Forward this email, or send them to <a href="${SITE}" style="color:${C.brand};">ossradar.net</a> to subscribe free.</p>
<p style="margin:0 0 8px;">You're receiving this because you signed up for the OSS Radar daily email at ossradar.net. Rankings come from public GitHub data, updated hourly; sponsors never affect them.${anyEst ? " * = estimated for repos we started tracking recently." : ""}</p>
<p style="margin:0;">OSS = open-source software: code anyone can read, use and improve.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function kit(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.kit.com/v4${path}`, {
    ...init,
    headers: { "X-Kit-Api-Key": process.env.KIT_API_KEY!, "Content-Type": "application/json", Accept: "application/json" },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Kit ${path} ${res.status}: ${body}`);
  return JSON.parse(body);
}

/** README's first prose paragraph, via the GitHub API (token optional). */
async function fetchReadme(fullName: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
      headers: { Accept: "application/vnd.github.raw+json", "User-Agent": "ossradar-newsletter", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
    });
    return res.ok ? await res.text() : null;
  } catch { return null; }
}

/** Optional short LLM summary via the Claude Code CLI when it's installed (local runs); null on any failure. */
function llmBlurb(fullName: string, readme: string): string | null {
  try {
    const out = execFileSync(process.env.CLAUDE_BIN || "claude", ["-p",
      `In one plain sentence (max 120 characters, no marketing words, no repo name), say what the GitHub project ${fullName} does, based on this README:\n\n${readme.slice(0, 6000)}`],
      { encoding: "utf8", timeout: 60_000, stdio: ["ignore", "pipe", "ignore"] });
    return cleanBlurb(out.split("\n").find((l) => l.trim()) ?? "");
  } catch { return null; }
}

/** One clean line per repo: description → README paragraph → LLM summary → neutral fallback. */
export async function buildBlurbs(list: Repo[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const r of list) {
    let b = repoBlurb(r);
    if (!b) {
      const readme = await fetchReadme(r.fullName);
      b = (readme && (readmeBlurb(readme) ?? llmBlurb(r.fullName, readme))) || null;
    }
    out.set(r.fullName, b ?? `A new ${r.language ? r.language + " " : ""}project from ${r.owner}${r.topics?.length ? ` (${r.topics.slice(0, 3).join(", ")})` : ""}.`);
  }
  return out;
}

async function main() {
  if (repos.length === 0) { console.log("No growing repos; skipping."); return; }
  const blurbs = await buildBlurbs(repos);
  const intro = llmIntro() ?? templateIntro();
  const html = buildHtml(blurbs, intro);
  mkdirSync("out", { recursive: true });
  writeFileSync("out/newsletter.html", html);
  console.log(`Subject: ${subject}`);
  console.log(`Preview: ${previewText}`);
  console.log(`Intro: ${intro}`);
  repos.forEach((r, i) => console.log(`${i + 1}. ${r.fullName} — ${blurbs.get(r.fullName)}`));
  if (process.env.DRY_RUN) { console.log("DRY_RUN: wrote out/newsletter.html, not sending."); return; }
  if (!process.env.KIT_API_KEY) throw new Error("KIT_API_KEY missing");

  const existing = await kit("/broadcasts?per_page=50");
  // Dedupe: one broadcast per data date (subject carries the ISO date; description too).
  if (existing.broadcasts?.some((b: { subject?: string; description?: string }) => b.subject?.includes(date) || b.description?.includes(date))) {
    console.log(`Broadcast for ${date} already exists; skipping.`); return;
  }
  const res = await kit("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      subject, content: html, preview_text: previewText,
      description: `Daily digest ${date}`, public: false,
      send_at: new Date(Date.now() + 2 * 60_000).toISOString(),
      published_at: new Date().toISOString(),
      // No subscriber_filter: Kit then sends to all subscribers (the API only accepts segment/tag filters).
    }),
  });
  console.log(`Scheduled Kit broadcast ${res.broadcast?.id} for ${res.broadcast?.send_at}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
