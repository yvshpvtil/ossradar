import type { Metadata } from "next";
import Link from "next/link";
import { abs, breadcrumbLd, linkListLd, ogDefaults, repoPath, withoutContext, websiteRef, pageNodeIds, RSS_ALTERNATE, twitterDefaults } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { getMonthTop, getMonthWindows, monthLabel } from "@/lib/monthly";
import { altLabel } from "@/lib/alternatives";
import { formatDate, formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";

const title = "Top GitHub repos by month";
const description = `Monthly roundups of the open-source AI and developer-tool repos that gained the most GitHub stars each month, measured daily by ${SITE.name}.`;

export function generateMetadata(): Metadata {
  return { title, description, alternates: { canonical: "/monthly", types: { ...RSS_ALTERNATE, "text/markdown": [{ url: "/monthly.md", title: `${title} (Markdown)` }] } }, openGraph: { ...ogDefaults, title, description, url: "/monthly" }, twitter: { ...twitterDefaults, title, description } };
}

export default function MonthlyIndex() {
  const months = getMonthWindows();
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Monthly", path: "/monthly" }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", ...pageNodeIds("/monthly"), name: title, description, url: abs("/monthly"), inLanguage: "en", isPartOf: websiteRef, mainEntity: withoutContext(linkListLd(title, months.map((w) => ({ name: `Top GitHub repos of ${monthLabel(w.month)}`, url: abs(`/monthly/${w.month}`) })))) }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-500"><Link href="/" className="hover:underline">Home</Link> / <span className="text-zinc-700 dark:text-zinc-300">Monthly</span></nav>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Which open-source AI and developer-tool repos gained the most GitHub stars in each calendar month. For single days see the <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href="/daily">daily archive</Link>.</p>
      {months.map((w) => (
        <section key={w.month} className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-xl font-semibold tracking-tight"><Link className="hover:underline" href={`/monthly/${w.month}`}>{monthLabel(w.month)}{w.complete ? "" : " (so far)"}</Link></h2>
          <p className="text-xs text-zinc-500">{formatDate(w.from)} to {formatDate(w.to)}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {getMonthTop(w.month, 5).map((e) => (
              <li key={e.fullName}>{e.repo ? <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href={repoPath(e.repo)}>{altLabel(e.repo)}</Link> : e.fullName} <span className="tabular-nums text-emerald-700 dark:text-emerald-400">+{formatNumber(e.gained)}</span></li>
            ))}
          </ol>
          <Link className="mt-2 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400" href={`/monthly/${w.month}`}>Full top 25 for {monthLabel(w.month)} →</Link>
        </section>
      ))}
    </div>
  );
}
