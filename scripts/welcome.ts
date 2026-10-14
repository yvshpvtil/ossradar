/**
 * Welcome email: builds the "You're subscribed to OSS Radar" email (newsletter v3 style) and
 * upserts it as the immediate (delay 0) email of the Kit "Welcome" sequence. The signup API
 * route (lib/kit.ts) adds every new subscriber to that sequence, so they get it right away.
 *
 *   DRY_RUN=1 -> write out/welcome.html only
 *   KIT_API_KEY, KIT_WELCOME_SEQUENCE_ID -> required to publish
 */
import { writeFileSync, mkdirSync } from "node:fs";

const SITE = "https://ossradar.net";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const C = { ink: "#18181b", body: "#3f3f46", muted: "#6b7280", line: "#e5e7eb", brand: "#4338ca" };
export const subject = "You're subscribed to OSS Radar";
const preview = "Your first issue lands tomorrow around 8:15 AM IST. One quick step so it reaches your inbox.";

const p = (html: string, style = "") => `<p class="body" style="margin:0 0 14px;font:16px/1.6 ${FONT};color:${C.body};${style}">${html}</p>`;
const eyebrow = (t: string) => `<p class="eyebrow" style="margin:24px 0 8px;font:700 12px/16px ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${C.brand};">${t}</p>`;
const rule = `<div class="rule" style="height:1px;line-height:1px;font-size:0;background:${C.line};margin:16px 0;">&nbsp;</div>`;
const li = (html: string) => `<tr><td valign="top" class="brandtxt" style="width:22px;padding:0 0 10px;font:700 16px/1.6 ${FONT};color:${C.brand};">→</td><td class="body" style="padding:0 0 10px;font:16px/1.6 ${FONT};color:${C.body};">${html}</td></tr>`;
const strong = (t: string) => `<strong class="ink" style="color:${C.ink};">${t}</strong>`;

export const html = `<style>
  @media (prefers-color-scheme: dark) {
    .wrap, body { background:#111113 !important; }
    .ink { color:#f4f4f5 !important; }
    .body { color:#d4d4d8 !important; }
    .muted { color:#a1a1aa !important; }
    .eyebrow, .brandtxt { color:#a5b4fc !important; }
    .lnk { color:#a5b4fc !important; }
    .rule { background:#27272a !important; }
    .btn { background:#6366f1 !important; }
  }
  [data-ogsc] .ink { color:#f4f4f5 !important; }
  [data-ogsc] .body { color:#d4d4d8 !important; }
  [data-ogsc] .eyebrow, [data-ogsc] .brandtxt, [data-ogsc] .lnk { color:#a5b4fc !important; }
</style>
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
<table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background:#ffffff;"><tr><td align="center" style="padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;"><tr><td style="padding:20px 16px 8px;text-align:left;">
<p style="margin:0;font:800 22px/28px ${FONT};"><span class="brandtxt" style="color:${C.brand};">◉ OSS Radar</span></p>
${rule}
<h1 class="ink" style="margin:8px 0 12px;font:800 26px/1.25 ${FONT};color:${C.ink};">You're in. Welcome!</h1>
${p(`Thanks for subscribing. Starting tomorrow, you'll get one short email each morning at about ${strong("8:15 AM IST")}.`, `font-size:17px;color:${C.ink};`)}
${eyebrow("What you'll get")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${li(`The ${strong("top 10 fastest-rising")} open-source AI and dev-tool repos of the day`)}
${li(`A one-line take on what each project does and why it's picking up stars`)}
${li(`Short, skimmable, free. Unsubscribe anytime in one click`)}
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 4px;"><tr>
<td class="btn" bgcolor="${C.brand}" style="border-radius:8px;background:${C.brand};"><a href="${SITE}/?src=welcome" style="display:inline-block;padding:12px 20px;font:600 15px/20px ${FONT};color:#ffffff;text-decoration:none;">See today's rankings</a></td>
</tr></table>
${eyebrow("One quick step")}
${p(`So the daily email doesn't get lost, add ${strong(`<a class="ink" href="mailto:hello@ossradar.net" style="color:${C.ink};text-decoration:none;">hello@ossradar.net</a>`)} to your contacts. If this landed in ${strong("Spam")} or ${strong("Promotions")}, move it to your Primary inbox or mark it "Not spam".`)}
${p(`Got a repo we should watch, or feedback? Just hit reply. A real person reads every message.`)}
${rule}
${p(`Live rankings, updated hourly: <a class="lnk" href="${SITE}" style="color:${C.brand};">ossradar.net</a>`, "font-size:15px;")}
${p(`You're getting this because you subscribed at ossradar.net.`, `font-size:13px;color:${C.muted};`)}
</td></tr></table>
</td></tr></table>`;

async function main() {
  mkdirSync("out", { recursive: true });
  writeFileSync("out/welcome.html", `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"></head><body style="margin:0">${html}</body></html>`);
  if (process.env.DRY_RUN) return console.log("wrote out/welcome.html");
  const seq = process.env.KIT_WELCOME_SEQUENCE_ID;
  const h = { "X-Kit-Api-Key": process.env.KIT_API_KEY!, "Content-Type": "application/json", Accept: "application/json" };
  const base = `https://api.kit.com/v4/sequences/${seq}/emails`;
  const list = await (await fetch(base, { headers: h })).json();
  const existing = list.emails?.[0];
  const body = JSON.stringify({ subject, preview_text: preview, content: html, delay_value: 0, delay_unit: "days", published: true });
  const r = await fetch(existing ? `${base}/${existing.id}` : base, { method: existing ? "PUT" : "POST", headers: h, body });
  console.log(r.status, (await r.text()).slice(0, 400));
}
main();
