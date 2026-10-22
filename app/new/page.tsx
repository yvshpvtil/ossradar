import { repoBlurb, stripWhy } from "@/lib/blurb";
import { PageNav } from "@/components/PageNav";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterForm } from "@/components/NewsletterForm";
import { WatchButton } from "@/components/WatchButton";
import { categoryLabel } from "@/lib/categories";
import { getData } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { NEW_DAYS, getNewRepos } from "@/lib/newRepos";
import { breadcrumbLd, collectionPageLd, itemListLd, ogDefaults, twitterImage } from "@/lib/seo";

const title = "New open-source AI & dev-tool repos, day by day";
const description = `New open-source AI and developer-tool repos created on GitHub in the last ${NEW_DAYS} days that are gaining stars fast, grouped by launch day. Updated hourly.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/new" },
  openGraph: { ...ogDefaults, title, description, url: "/new" },
  twitter: { card: "summary_large_image", title, description, ...twitterImage },
};

export default function NewPage() {
  const groups = getNewRepos();
  const total = groups.reduce((n, g) => n + g.repos.length, 0);
  const data = getData();
  return (
    <>
      <JsonLd data={collectionPageLd({ name: title, description, path: "/new", dateModified: data.generatedAt, mainEntity: itemListLd(title, groups.flatMap((g) => g.repos)) })} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "New repos", path: "/new" }])} />
      <PageNav crumbs={[{ name: "New repos" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Updated hourly</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">New repos, day by day</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Projects created on GitHub in the last {NEW_DAYS} days that are already among the {data.repos.length} fastest-rising
        AI &amp; dev-tool repos we track. Grouped by the day they were created.
      </p>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{total} new repos · last {NEW_DAYS} days · updated {formatDate(data.generatedAt)}</p>
      <div className="mt-6 max-w-xl rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="mb-2 text-sm font-medium">Get the top rising repos in your inbox every day</p>
        <NewsletterForm />
      </div>
      <div className="mt-8 space-y-8">
        {groups.map((g) => (
          <section key={g.day} aria-labelledby={`d-${g.day}`}>
            <h2 id={`d-${g.day}`} className="mb-2 flex items-baseline gap-2 text-xl font-semibold tracking-tight">
              {formatDate(`${g.day}T00:00:00Z`)}
              <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">{g.repos.length} new</span>
            </h2>
            <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {g.repos.map((r) => (
                <li key={r.fullName} className="relative cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/repo/${r.owner}/${r.name}`} className="break-words font-medium hover:underline after:absolute after:inset-0 after:content-['']">
                      <span className="text-zinc-500 dark:text-zinc-400">{r.owner}/</span>{r.name}
                    </Link>
                    {(repoBlurb(r) ?? stripWhy(r.oneLiner)) && <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{repoBlurb(r) ?? stripWhy(r.oneLiner)}</p>}
                    <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <Link href={`/category/${r.category}`} className="relative z-10 hover:underline">{categoryLabel(r.category)}</Link>
                      {r.language && <span>{r.language}</span>}
                    </p>
                  </div>
                  <span className="shrink-0 pt-0.5 font-mono text-sm font-semibold tabular-nums">★ {formatNumber(r.stars)}</span>
                  <span className="relative z-10"><WatchButton fullName={r.fullName} /></span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {groups.length === 0 && <p className="text-sm text-zinc-500">No new repos in the last {NEW_DAYS} days yet.</p>}
      </div>
    </>
  );
}
