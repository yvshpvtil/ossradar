/**
 * Cloudflare-only step, run after `opennextjs-cloudflare build` (npm run cf:build).
 *
 * 1. Pre-renders every per-page Open Graph card (/repo/x/y/opengraph-image/card, hubs, daily,
 *    alternatives) into .open-next/assets, so Cloudflare serves them as static files.
 *    Next only renders these cards on first request (they are not in the prerender manifest), and
 *    on Workers that on-demand render fails (Cache Components flags @vercel/og's async WASM setup
 *    as uncached IO) and would blow the free plan's 10 ms CPU budget anyway. The PNGs come from
 *    `next start` on the same .next build, so they are byte-for-byte what Node/Vercel serves.
 * 2. Swaps the @vercel/og WASM + font modules in the server bundle for empty stubs. Nothing in the
 *    Worker renders images any more (index cards are prerendered by Next, per-page cards above),
 *    and dropping them saves ~600 KiB gzip, which keeps the Worker under the 3 MiB free limit.
 *
 * Set CF_KEEP_OG=1 to skip step 2 (e.g. on the Workers Paid plan).
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const assets = join(root, ".open-next", "assets");
const handler = join(root, ".open-next", "server-functions", "default", "handler.mjs");
if (!existsSync(handler)) throw new Error("run `opennextjs-cloudflare build` first");

// ---- 1. per-page OG cards -> static assets
const manifest = JSON.parse(readFileSync(join(root, ".next", "prerender-manifest.json"), "utf8"));
const CARD_PAGE = /^\/(repo\/[^/]+\/[^/]+|alternatives\/[^/]+\/[^/]+|(category|topic|language|trending|daily)\/[^/]+)$/;
const cards = Object.keys(manifest.routes)
  .filter((p) => CARD_PAGE.test(p) && !p.endsWith("/opengraph-image"))
  .map((p) => `${p}/opengraph-image/card`);

const port = 3100 + Math.floor(Math.random() * 800);
const server = spawn(join(root, "node_modules", ".bin", "next"), ["start", "-p", String(port)], { stdio: ["ignore", "pipe", "inherit"] });
await new Promise((resolve, reject) => {
  server.stdout.on("data", (d) => /Ready|started server/i.test(String(d)) && resolve());
  server.on("exit", (c) => reject(new Error(`next start exited (${c})`)));
  setTimeout(() => reject(new Error("next start timed out")), 60_000);
});
let failed = 0;
try {
  const queue = [...cards];
  const worker = async () => {
    for (let p; (p = queue.shift()); ) {
      const res = await fetch(`http://127.0.0.1:${port}${encodeURI(p)}`, { redirect: "manual" });
      if (res.status !== 200 || res.headers.get("content-type") !== "image/png") {
        console.error(`card ${p}: HTTP ${res.status} ${res.headers.get("content-type")}`);
        failed++;
        continue;
      }
      const file = join(assets, ...p.split("/").filter(Boolean));
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
} finally {
  server.kill();
}
if (failed) throw new Error(`${failed} OG cards failed to render`);
// Extensionless files get no Content-Type from Workers assets; give them the one Next sends.
appendFileSync(
  join(assets, "_headers"),
  "\n/*/opengraph-image/card\n  Content-Type: image/png\n  Cache-Control: public, max-age=0, must-revalidate\n",
);
console.log(`cf-postbuild: pre-rendered ${cards.length} OG cards into .open-next/assets`);

// ---- 2. stub @vercel/og WASM + font in the Worker bundle
if (process.env.CF_KEEP_OG !== "1") {
  const stubDir = join(dirname(handler), "og-stub");
  mkdirSync(stubDir, { recursive: true });
  writeFileSync(join(stubDir, "empty.wasm"), Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]));
  writeFileSync(join(stubDir, "empty.ttf.bin"), Buffer.alloc(0));
  let code = readFileSync(handler, "utf8");
  const swaps = [
    [/"[^"]*\/@vercel\/og\/resvg\.wasm\?module"/g, `"${join(stubDir, "empty.wasm")}?module"`],
    [/"[^"]*\/@vercel\/og\/yoga\.wasm\?module"/g, `"${join(stubDir, "empty.wasm")}?module"`],
    [/"[^"]*\/@vercel\/og\/Geist-Regular\.ttf\.bin"/g, `"${join(stubDir, "empty.ttf.bin")}"`],
  ];
  for (const [re, to] of swaps) {
    const n = (code.match(re) ?? []).length;
    if (n !== 1) throw new Error(`cf-postbuild: expected 1 match for ${re}, found ${n} (OpenNext output changed?)`);
    code = code.replace(re, to);
  }
  writeFileSync(handler, code);
  console.log("cf-postbuild: stubbed @vercel/og WASM/font in the Worker bundle");
}
