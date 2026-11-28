import type { Metadata } from "next";
import Link from "next/link";
import { abs, breadcrumbLd, linkListLd, ogDefaults, repoPath, withoutContext, websiteRef, pageNodeIds, RSS_ALTERNATE, twitterDefaults } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { getWeekTop, getWeekWindows, weekRange } from "@/lib/weekly";
import { altLabel } from "@/lib/alternatives";
import { formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";

const title = "Top GitHub repos by week";
const description = `Weekly roundups of the open-source AI and developer-tool repos that gained the most GitHub stars each week (Monday to Sunday, UTC), measured daily by ${SITE.name}.`;

export function generateMetadata(): Metadata {
  return { title, description, alternates: { canonical: "/weekly", types: { ...RSS_ALTERNATE, "text/markdown": [{ url: "/weekly.md", title: `${title} (Markdown)` }] } }, openGraph: { ...ogDefaults, title, description, url: "/weekly" }, twitter: { ...twitterDefaults, title, description } };
}

const link = "text-indigo-600 hover:underline dark:text-indigo-400";

export default function WeeklyIndex() {
  const weeks = getWeekWindows();
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Weekly", path: "/weekly" }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", ...pageNodeIds("/weekly"), name: title, description, url: abs("/weekly"), inLanguage: "en", isPartOf: websiteRef, mainEntity: withoutContext(linkListLd(title, weeks.map((w) => ({ name: `Top GitHub repos of the week: ${weekRange(w)}`, url: abs(`/weekly/${w.week}`) })))) }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-500"><Link href="/" className="hover:underline">Home</Link> / <span className="text-zinc-700 dark:text-zinc-300">Weekly</span></nav>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Which open-source AI and developer-tool repos gained the most GitHub stars in each ISO week (Monday to Sunday, UTC). Single days: the <Link className={link} href="/daily">daily archive</Link>; whole months: <Link className={link} href="/monthly">monthly roundups</Link>.</p>
      {weeks.map((w) => (
        <section key={w.week} className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-xl font-semibold tracking-tight"><Link className="hover:underline" href={`/weekly/${w.week}`}>{weekRange(w)}{w.complete ? "" : " (so far)"}</Link></h2>
          <p className="text-xs text-zinc-500">ISO week {w.week}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {getWeekTop(w.week, 5).map((e) => (
              <li key={e.fullName}>{e.repo ? <Link className={link} href={repoPath(e.repo)}>{altLabel(e.repo)}</Link> : e.fullName} <span className="tabular-nums text-emerald-700 dark:text-emerald-400">+{formatNumber(e.gained)}</span></li>
            ))}
          </ol>
          <Link className={`mt-2 inline-block text-sm ${link}`} href={`/weekly/${w.week}`}>Full top 25 for this week →</Link>
        </section>
      ))}
    </div>
  );
}
