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
const subject = lead ? `${nameOf(lead)} tops today's rising open-source projects` : "Today's rising open-source projects";
const previewText = lead
  ? `Also climbing: ${repos.slice(1, 4).map(nameOf).join(", ")}. Your OSS Radar daily for ${niceShort}.`
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

// ---------- email building blocks ----------
// Mobile-first: one full-width column, 16px gutters, no nested cards, no fixed side columns.
// Light palette with explicit colours; dark-mode overrides for clients that honour prefers-color-scheme
// (Apple Mail, iOS Mail, Outlook.com via [data-ogsc]); Gmail's forced inversion still reads well because
// we avoid tinted boxes and light-on-light text.
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const C = { ink: "#18181b", body: "#3f3f46", muted: "#6b7280", line: "#e5e7eb", brand: "#4338ca", green: "#047857" };

/** Let names wrap only after "/" , "-" , "_" or "." (never mid-word). */
const nameHtml = (t: string) => esc(t).replace(/([/\-_.])/g, "$1<wbr>");
const pill = (text: string, cls = "", style = "") =>
  `<span class="pill ${cls}" style="display:inline-block;white-space:nowrap;margin:0 4px 4px 0;padding:2px 8px;border:1px solid ${C.line};border-radius:999px;font:600 13px/20px ${FONT};color:${C.body};${style}">${text}</span>`;
const stats = (r: Repo, total = true) =>
  pill(`+${fmt(r.delta24h ?? 0)} today${r.estimated24h ? "*" : ""}`, "up", `color:${C.green};border-color:#a7f3d0;`) +
  (total ? pill(`${short(r.stars)} stars`) : "") +
  (r.language ? pill(esc(r.language)) : "");
const eyebrow = (t: string) => `<p class="eyebrow" style="margin:28px 0 8px;font:700 12px/16px ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${C.brand};">${t}</p>`;
const p = (html: string, style = "") => `<p class="body" style="margin:0 0 12px;font:16px/1.6 ${FONT};color:${C.body};${style}">${html}</p>`;
const rule = `<div class="rule" style="height:1px;line-height:1px;font-size:0;background:${C.line};margin:16px 0;">&nbsp;</div>`;

const sponsorHtml = () => {
  const s = getActiveSponsor(new Date());
  if (!s) return "";
  return `<div class="sponsor" style="margin:16px 0 0;padding:12px 14px;border:1px solid #fcd34d;border-radius:10px;font:15px/1.5 ${FONT};color:${C.ink};">
<span style="font:700 11px/16px ${FONT};letter-spacing:.1em;text-transform:uppercase;color:#92400e;">Sponsor</span><br>
<a href="${esc(s.url)}" rel="sponsored" style="color:${C.ink};text-decoration:none;"><strong>${esc(s.name)}</strong>: ${esc(s.tagline)}</a></div>`;
};

function buildHtml(blurbs: Map<string, string>, intro: string): string {
  const [hero, ...rest] = repos;
  const also = rest.slice(0, 5);
  const quick = rest.slice(5);
  const b = (r: Repo) => esc(blurbs.get(r.fullName) ?? "");
  const anyEst = repos.some((r) => r.estimated24h);
  const item = (r: Repo, n: number, size = 18) =>
    `<p class="name" style="margin:0 0 4px;font:700 ${size}px/1.35 ${FONT};color:${C.ink};word-break:normal;overflow-wrap:break-word;"><span class="muted" style="color:${C.muted};font-weight:600;">${n}.</span> <a class="ink" href="${repoUrl(r)}" style="color:${C.ink};text-decoration:none;">${nameHtml(r.fullName)}</a></p>`;

  const heroHtml = `${eyebrow("Repo of the day")}
${item(hero, 1, 22)}
${p(b(hero), `font-size:17px;color:${C.ink};`)}
<div style="margin:0 0 10px;">${stats(hero)}${pill(esc(CAT[hero.category ?? "other"] ?? "Dev tools"))}</div>
${p(`<strong class="ink" style="color:${C.ink};">Why it matters:</strong> ${esc(heroWhy(hero))}`)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 0;"><tr>
<td class="btn" bgcolor="${C.brand}" style="border-radius:8px;background:${C.brand};"><a href="${repoUrl(hero)}" style="display:inline-block;padding:11px 18px;font:600 15px/20px ${FONT};color:#ffffff;text-decoration:none;">See the star chart</a></td>
<td style="padding-left:14px;font:15px/20px ${FONT};"><a href="${esc(hero.url)}" class="lnk" style="color:${C.brand};text-decoration:underline;">GitHub</a></td>
</tr></table>`;

  const alsoHtml = also.length ? `${eyebrow("Also rising")}
${also.map((r, i) => `${i ? rule : ""}${item(r, i + 2)}${p(b(r), "margin-bottom:8px;")}<div>${stats(r)}</div>`).join("\n")}` : "";

  const quickHtml = quick.length ? `${eyebrow("Quick hits")}
${quick.map((r, i) => `<p class="body" style="margin:0 0 12px;font:15px/1.55 ${FONT};color:${C.body};overflow-wrap:break-word;"><strong class="ink" style="color:${C.ink};"><span class="muted" style="color:${C.muted};">${i + 7}.</span> <a class="ink" href="${repoUrl(r)}" style="color:${C.ink};text-decoration:none;">${nameHtml(r.fullName)}</a></strong> <span class="up" style="color:${C.green};font-weight:600;white-space:nowrap;">+${fmt(r.delta24h ?? 0)}${r.estimated24h ? "*" : ""}</span><br>${b(r)}</p>`).join("\n")}` : "";

  const newHtml = newThisWeek.length ? `${eyebrow("New this week")}
${p("Created in the last 7 days and already picking up stars.", `font-size:14px;color:${C.muted};`)}
${newThisWeek.map((r) => `<p class="body" style="margin:0 0 12px;font:15px/1.55 ${FONT};color:${C.body};overflow-wrap:break-word;"><strong class="ink" style="color:${C.ink};"><a class="ink" href="${repoUrl(r)}" style="color:${C.ink};text-decoration:none;">${nameHtml(r.fullName)}</a></strong> <span class="muted" style="color:${C.muted};white-space:nowrap;">${ageDays(r)}d old · +${fmt(r.delta24h ?? 0)} today</span><br>${b(r) || esc(r.description ?? "")}</p>`).join("\n")}` : "";

  const hnHtml = hnPick ? `${eyebrow("On Hacker News")}
${p(`<strong class="ink" style="color:${C.ink};">“${esc(hnPick.m!.top!.title)}”</strong> drew ${fmt(hnPick.m!.top!.points)} points and ${fmt(hnPick.m!.top!.comments)} comments on Hacker News, the tech discussion site. It's about <a class="lnk" href="${repoUrl(hnPick.r)}" style="color:${C.brand};">${nameHtml(hnPick.r.fullName)}</a>.`)}` : "";

  return `<style>
  @media (prefers-color-scheme: dark) {
    .wrap, body { background:#111113 !important; }
    .ink, .name, .name a { color:#f4f4f5 !important; }
    .body { color:#d4d4d8 !important; }
    .muted { color:#a1a1aa !important; }
    .eyebrow, .brandtxt { color:#a5b4fc !important; }
    .up { color:#6ee7b7 !important; border-color:#065f46 !important; }
    .pill { color:#d4d4d8 !important; border-color:#3f3f46 !important; }
    .pill.up, .up { color:#6ee7b7 !important; border-color:#065f46 !important; }
    .lnk { color:#a5b4fc !important; }
    .rule { background:#27272a !important; }
    .btn { background:#6366f1 !important; }
  }
  [data-ogsc] .ink, [data-ogsc] .name a { color:#f4f4f5 !important; }
  [data-ogsc] .body { color:#d4d4d8 !important; }
  [data-ogsc] .eyebrow { color:#a5b4fc !important; }
</style>
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(previewText)}</div>
<table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background:#ffffff;"><tr><td align="center" style="padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;"><tr><td style="padding:20px 16px 8px;text-align:left;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font:800 22px/28px ${FONT};"><span class="brandtxt" style="color:${C.brand};">◉ OSS Radar</span></td>
<td align="right" class="muted" style="font:13px/18px ${FONT};color:${C.muted};white-space:nowrap;">Issue #${issueNo} · ${esc(niceShort)}</td>
</tr></table>
${rule}
${sponsorHtml()}
${eyebrow("Today in open source").replace("margin:28px 0 8px", "margin:8px 0 8px")}
${p(intro, `font-size:17px;color:${C.ink};`)}
${p(`Stars are GitHub's bookmark button: a rough signal of how many developers are paying attention.`, `font-size:13px;color:${C.muted};`)}
${heroHtml}
${alsoHtml}
${quickHtml}
${newHtml}
${hnHtml}
${rule}
${p(`Full live rankings, updated hourly: <a class="lnk" href="${SITE}" style="color:${C.brand};">ossradar.net</a>`, "font-size:15px;")}
${p(`Know someone who'd like this? Forward it. You're getting this because you subscribed at ossradar.net. Rankings come from public GitHub data; sponsors never affect them.${anyEst ? " * = estimated for recently added repos." : ""} OSS means open-source software: code anyone can read, use and improve.`, `font-size:13px;color:${C.muted};`)}
</td></tr></table>
</td></tr></table>`;
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
  // Dedupe: one broadcast per data date, matched on description "Daily digest <date>" (older issues also had it in the subject). Test sends must not put a date in subject/description.
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
