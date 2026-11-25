import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, staticPageLd, ogDefaults, pageAlternates, RSS_ALTERNATE, twitterDefaults } from "@/lib/seo";
import { PageNav } from "@/components/PageNav";
import { JsonLd } from "@/components/JsonLd";
import { API_BASE, API_TERMS, REPO_FIELDS, TRENDING_FIELDS, apiExamples, curlTrending, jsTrending, pythonTrending, type Field } from "@/lib/apiDocs";
import { SITE } from "@/lib/site";

// <title> gets the " · OSS Radar" suffix from the root template; social cards carry the brand themselves.
const title = "Free GitHub trending repos API (JSON, no key)";
const socialTitle = `${SITE.name} API: free JSON for trending GitHub repos`;
const description = `GitHub has no trending API. Get the top 100 fast-rising AI and dev-tool repos by 24h star gain, or any tracked repo's star history, as free JSON. No key.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { ...pageAlternates("/developers"), types: { ...RSS_ALTERNATE, "text/markdown": [{ url: "/developers.md", title: `${socialTitle} (Markdown)` }], "application/openapi+json": [{ url: "/api/v1/openapi.json", title: "OpenAPI spec" }] } },
  openGraph: { siteName: ogDefaults.siteName, locale: ogDefaults.locale, type: ogDefaults.type, images: ogDefaults.images, title: socialTitle, description, url: "/developers" },
  twitter: { ...twitterDefaults, title: socialTitle, description },
};

const h2 = "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";
const pre = "overflow-x-auto rounded bg-zinc-100 p-3 font-mono text-xs leading-relaxed dark:bg-zinc-900";

function Fields({ fields }: { fields: Field[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="py-2 pr-3 font-semibold">Field</th>
            <th className="py-2 pr-3 font-semibold">Type</th>
            <th className="py-2 font-semibold">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="border-b border-zinc-100 align-top dark:border-zinc-900">
              <td className="py-2 pr-3 font-mono">{f.name}</td>
              <td className="py-2 pr-3">{f.type}</td>
              <td className="py-2">{f.about}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DevelopersPage() {
  const { top, trending, tracked } = apiExamples();
  const ex = top ? `${top.owner}/${top.name}` : "upstash/context7";
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "API", path: "/developers" }])} />
      <JsonLd data={staticPageLd({ name: socialTitle, description, path: "/developers" })} />
      <PageNav crumbs={[{ name: "API" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">For developers</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Trending GitHub repos API</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        GitHub doesn&apos;t offer an API for its trending page. {SITE.name} publishes its hourly leaderboard of fast-rising open-source AI and
        developer-tool repos ({tracked} tracked) as free JSON you can call from any script, app or AI agent: no key, no sign-up, open CORS.
      </p>

      <section aria-labelledby="endpoints" className="mt-10 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <h2 id="endpoints" className={h2}>Endpoints</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <a className="font-mono underline" href="/api/v1/trending">GET /api/v1/trending</a>: the top 100 tracked repos ranked by stars gained in the
            last 24 hours, with 7-day gains, stars, forks, language, category and topics.
          </li>
          <li>
            <span className="font-mono">GET /api/v1/repo/{"{owner}/{name}"}</span>: one tracked repo (for example{" "}
            <a className="font-mono underline" href={`/api/v1/repo/${ex}`}>/api/v1/repo/{ex}</a>): stars, gains, rank today and this week, daily star
            history, top Hacker News story, alternatives and its badge URL. Repos {SITE.name} doesn&apos;t track get a JSON 404.
          </li>
          <li>
            <a className="underline" href="/api/v1/openapi.json">OpenAPI 3.1 spec</a> for both endpoints, ready to load as an agent tool or a custom GPT
            action, and an <a className="underline" href="/.well-known/api-catalog">RFC 9727 API catalog</a>.
          </li>
        </ul>
      </section>

      <section aria-labelledby="quick-start" className="mt-10 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <h2 id="quick-start" className={h2}>Quick start</h2>
        <p>Today&apos;s top 10 risers from the command line:</p>
        <pre className={pre}>{curlTrending}</pre>
        <p>Python:</p>
        <pre className={pre}>{pythonTrending}</pre>
        <p>JavaScript (browser or Node 18+):</p>
        <pre className={pre}>{jsTrending}</pre>
      </section>

      <section aria-labelledby="trending-fields" className="mt-10 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <h2 id="trending-fields" className={h2}>/api/v1/trending fields</h2>
        <Fields fields={TRENDING_FIELDS} />
      </section>

      <section aria-labelledby="repo-fields" className="mt-10 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <h2 id="repo-fields" className={h2}>/api/v1/repo/{"{owner}/{name}"} fields</h2>
        <p>Same identity, stars, gains and dates as the trending list, plus:</p>
        <Fields fields={REPO_FIELDS} />
      </section>

      {trending && (
        <section aria-labelledby="example" className="mt-10 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <h2 id="example" className={h2}>Example response</h2>
          <p>Trimmed to one repo and a few fields, from the current data:</p>
          <pre className={pre}>{JSON.stringify(trending, null, 2)}</pre>
        </section>
      )}

      <section aria-labelledby="terms" className="mt-10 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <h2 id="terms" className={h2}>Terms and limits</h2>
        <ul className="list-disc space-y-1 pl-5">
          {API_TERMS.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <p>
          How the numbers are measured: <Link className="underline" href="/about">methodology</Link>. Base URL: <code>{API_BASE}</code>.
        </p>
      </section>

      <section aria-labelledby="no-code" className="mt-10 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <h2 id="no-code" className={h2}>Without code</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><a className="underline" href="/rss.xml">RSS feed</a> of the hourly top repos, or the <a className="underline" href="/daily/rss.xml">daily digest feed</a>.</li>
          <li>For AI assistants: <a className="underline" href="/llms.txt">llms.txt</a>, <a className="underline" href="/llms-full.txt">llms-full.txt</a>, and any page as Markdown by adding <code>.md</code> (this page: <a className="underline" href="/developers.md">/developers.md</a>).</li>
          <li>Maintainers: a live <Link className="underline" href="/badge">README badge</Link>.</li>
        </ul>
        <p>Need a field that isn&apos;t here? Email <a className="underline" href={`mailto:${SITE.sponsorEmail}`}>{SITE.sponsorEmail}</a>.</p>
      </section>
    </div>
  );
}
