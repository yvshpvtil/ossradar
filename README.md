# OSS Radar

**[ossradar.net](https://ossradar.net)** tracks the fastest-rising open-source AI and developer-tool repos on
GitHub every day. Repos are ranked by **star velocity** (stars gained in the last 24h / 7d), and each one gets a
one-line "what it does and why it matters".

It's built with Next.js (App Router, TypeScript, Tailwind, Cache Components). Every page is prerendered at build
time from `data/repos.json`, so it runs on the Vercel free tier without a database.

## How it works

```
GitHub Action (daily 02:30 UTC)
  └─ npm run collect  →  data/snapshots/YYYY-MM-DD.json   (full_name → stars)
                      →  data/repos.json                   (metadata + deltas + history)
  └─ commit data/ if changed  →  Vercel redeploys  →  static site rebuilt
```

### Data job (`scripts/collect.ts`)

- Searches the GitHub Search API for repos created in the last ~90 days across AI/devtools topics and keywords
  (llm, ai-agents, mcp, rag, vector-database, local-llm, ollama, coding-agent, claude-code, devops, kubernetes,
  developer-tools, …). It also picks up recently pushed popular repos (≥2k stars) in the same space. Auth comes
  from `GITHUB_TOKEN`, with `gh auth token` as a fallback.
- Respects rate limits by waiting about 2s between search calls and honoring `x-ratelimit-reset` / `retry-after`.
  It skips forks, archived repos and `awesome-*` lists, removes duplicates, and keeps the top **450** by 7-day
  velocity.
- Saves every repo it saw to `data/snapshots/<today>.json`.
- **Deltas** come from prior snapshots: `delta24h` from yesterday's snapshot and `delta7d` from the snapshot 7 days
  ago. With only partial history it extrapolates from the snapshots it has. With none, it uses
  `stars ÷ age-in-days`. Any value that isn't measured sets `estimated24h` / `estimated7d` / `velocityEstimated`,
  and the UI shows an **est.** badge plus a note explaining it.
- **Category** comes from topics and keywords (`lib/categories.ts`): AI agents, LLM tooling, MCP, coding agents,
  RAG/vector, local LLMs, DevOps, other.
- **One-liners** come from `scripts/summarize.ts`. By default they're built from a template using the repo
  description. If `ANTHROPIC_API_KEY` is set, Claude writes a one-sentence summary instead (`SUMMARY_MODEL`,
  default `claude-opus-5-5`). If the call errors or is refused, the template is used. LLM results are cached in
  `data/summaries.json` by description, so unchanged repos aren't summarized again. To add another provider, add a
  branch in `summarize()`.

### Site

| Route | What |
| --- | --- |
| `/` | Leaderboard with a Today / This week toggle and category filters |
| `/repo/[owner]/[name]` | Stars, deltas, language, description, one-liner, SVG star-history sparkline, similar repos |
| `/category/[slug]` | Leaderboard for one category |
| `/sponsor` | Sponsorship slots and pricing ($99/week at launch, +$25 per sale) |
| `/about` | Methodology |
| `/api/subscribe` | Newsletter signup (POST JSON or form `{ email }`) |
| `/rss.xml`, `/sitemap.xml`, `/robots.txt` | Feeds and SEO |
| `opengraph-image` | Generated OG cards for the home page, categories and every repo |

Newsletter signups go through the `SubscriberStore` interface in `lib/subscribers.ts`. The default
`JsonFileStore` appends to `data/subscribers.json`, which is gitignored. Vercel's filesystem is read-only, so
signups go to Kit via `lib/kit.ts`.

The sponsor bar and card (`components/SponsorSlot.tsx`) say "Your product here, sponsor OSS Radar" and link to
`/sponsor` until you pass a real `sponsor` prop.

## Local development

```bash
npm install
npm run collect   # needs GITHUB_TOKEN or a logged-in `gh` CLI; takes ~2 minutes
npm run dev       # http://localhost:3000
npm run build && npm run lint
```

Environment variables (all optional except a GitHub token for `collect`):

| Var | Used by | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | collect | GitHub API auth (falls back to `gh auth token`) |
| `ANTHROPIC_API_KEY`, `SUMMARY_MODEL` | collect | Use an LLM for one-liners instead of the template |
| `NEXT_PUBLIC_SITE_URL` | site | Canonical URL (default `https://ossradar.net`) |
| `KIT_API_KEY`, `KIT_FORM_ID` (optional `KIT_V3_API_KEY`) | `/api/subscribe` | Add signups to the Kit form (v4 API, v3 fallback) |

## TODO

- [ ] **Deploy to Vercel**: import the GitHub repo in Vercel (framework preset Next.js, no env vars required).
  Each commit from the daily workflow triggers a redeploy.
- [ ] **DNS (Namecheap)**: add `ossradar.net` under Vercel → Domains. Then, in Namecheap Advanced DNS, create the
  records Vercel shows (typically `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`).
- [x] **Newsletter provider**: Kit (form 10039673), env vars set in Vercel.
- [ ] **Payment link**: create a Stripe or Lemon Squeezy payment link for the $99/week slot and set
  `sponsorPaymentUrl` in `lib/site.ts`. Raise `sponsorPriceUsd` by $25 after each sale.
- [ ] Set up `hello@ossradar.net`, or change `sponsorEmail` in `lib/site.ts`.
- [ ] Optional: add `ANTHROPIC_API_KEY` as a repo secret to get LLM one-liners.
- [ ] Later: featured listings and a generator for the weekly newsletter issue.

## Newsletter
The signup form is a native React form posting to `/api/subscribe`, which validates (honeypot + per-IP rate limit) and adds the email to the Kit form (`KIT_API_KEY`, `KIT_FORM_ID`).
