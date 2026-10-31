import type { Metadata } from "next";
import { PageNav } from "@/components/PageNav";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EstimateNote } from "@/components/EstBadge";
import { JsonLd } from "@/components/JsonLd";
import { Leaderboard } from "@/components/Leaderboard";
import { altLabel } from "@/lib/alternatives";
import { CATEGORIES } from "@/lib/categories";
import { deltaFor, getData } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { LANDINGS, getLanding } from "@/lib/landing";
import { hubLeaderProps } from "@/lib/leader";
import { breadcrumbLd, collectionPageLd, itemListLd, ogDefaults, pageAlternates } from "@/lib/seo";

export function generateStaticParams() {
  return LANDINGS.map((l) => ({ slug: l.slug }));
}

const periodFor = (slug: string) => (slug === "github-repos-today" ? "today" : "week");

// Live snippet: the view's static pitch plus who leads it right now by project name (SGLang, not sgl-project/sglang),
// as many leaders as fit ~158 chars; the hand-written description is the fallback when nothing is gaining.
function landingDescription(l: NonNullable<ReturnType<typeof getLanding>>) {
  const period = periodFor(l.slug);
  const leaders = l.select().filter((r) => deltaFor(r, period) > 0).slice(0, 3);
  const items = leaders.map((r, i) => `${altLabel(r)} (+${formatNumber(deltaFor(r, period))}${i ? "" : " stars"})`);
  for (let n = items.length; n > 0; n--) {
    const list = n === 1 ? items[0] : `${items.slice(0, n - 1).join(", ")} and ${items[n - 1]}`;
    const d = `${l.metaHead} Leading now: ${list}.`;
    if (d.length <= 158) return d;
  }
  return l.description;
}

export async function generateMetadata({ params }: PageProps<"/trending/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const l = getLanding(slug);
  if (!l) return {};
  const url = `/trending/${l.slug}`;
  const description = landingDescription(l);
  return {
    title: l.title,
    description,
    alternates: pageAlternates(url),
    // Images come from ./opengraph-image (a per-view card), so the generic site image is left out here.
    openGraph: { siteName: ogDefaults.siteName, locale: ogDefaults.locale, type: ogDefaults.type, title: l.title, description, url },
    twitter: { card: "summary_large_image", title: l.title, description },
  };
}

export default async function TrendingPage({ params }: PageProps<"/trending/[slug]">) {
  const { slug } = await params;
  const l = getLanding(slug);
  if (!l) notFound();
  const repos = l.select();
  const path = `/trending/${l.slug}`;
  // Answer-first, data-backed summary for search snippets and AI assistants: who leads this view right now,
  // what the top 10 gained together, and which categories dominate it (linked, so the landing cross-links its hubs).
  const period = periodFor(l.slug);
  const windowText = period === "today" ? "the last 24 hours" : "the last 7 days";
  const top10 = repos.slice(0, 10).filter((r) => deltaFor(r, period) > 0);
  const leaders = top10.slice(0, 3);
  const top10Total = top10.reduce((n, r) => n + deltaFor(r, period), 0);
  const est = (r: (typeof repos)[number]) => (period === "today" ? r.estimated24h : r.estimated7d);
  const catCounts = top10.reduce((m, r) => m.set(r.category, (m.get(r.category) ?? 0) + 1), new Map<string, number>());
  const topCats = CATEGORIES.map((c) => ({ ...c, n: catCounts.get(c.slug) ?? 0 }))
    .filter((c) => c.n >= 2 && c.slug !== "other")
    .sort((a, b) => b.n - a.n)
    .slice(0, 2);
  return (
    <>
      <JsonLd data={collectionPageLd({ name: l.title, description: landingDescription(l), path, dateModified: getData().generatedAt, ogCard: true, mainEntity: itemListLd(l.h1, repos) })} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: l.title, path }])} />
      <PageNav crumbs={[{ name: l.title }]} />
      <section className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{l.h1}</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">{l.intro}</p>
        {leaders.length > 0 && (
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            The top {top10.length} gained about {formatNumber(top10Total)} stars in {windowText}. Leading right now:{" "}
            {leaders.map((r, i) => (
              <span key={r.fullName}>
                {i > 0 && (i === leaders.length - 1 ? " and " : ", ")}
                <Link className="underline" href={`/repo/${r.owner}/${r.name}`}>{altLabel(r)}</Link> (+{formatNumber(deltaFor(r, period))}{est(r) ? "*" : ""})
              </span>
            ))}
            .
            {topCats.length > 0 && (
              <>
                {" "}Most common in the top {top10.length}:{" "}
                {topCats.map((c, i) => (
                  <span key={c.slug}>
                    {i > 0 && " and "}
                    <Link className="underline" href={`/category/${c.slug}`}>{c.label}</Link> ({c.n})
                  </span>
                ))}
                .
              </>
            )}
            {leaders.some(est) && <span className="text-xs text-zinc-500"> * Estimated.</span>}
          </p>
        )}
        <p className="mt-1 text-xs text-zinc-500">{repos.length} repos · updated {formatDate(getData().generatedAt)}</p>
      </section>
      <h2 id="leaderboard" className="mb-3 scroll-mt-6 text-xl font-semibold tracking-tight">Leaderboard</h2>
      {repos.some((r) => r.velocityEstimated) && <EstimateNote className="mb-4" />}
      <Leaderboard {...hubLeaderProps(repos, l.slug === "github-repos-today" ? "today" : "week", Date.parse(getData().generatedAt))} defaultPeriod={l.slug === "github-repos-today" ? "today" : "week"} />
      <section className="mt-10 text-sm">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">More views</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {LANDINGS.filter((x) => x.slug !== l.slug).map((x) => (
            <li key={x.slug}><Link className="text-indigo-600 hover:underline dark:text-indigo-400" href={`/trending/${x.slug}`}>{x.title}</Link></li>
          ))}
          {CATEGORIES.map((c) => (
            <li key={c.slug}><Link className="text-indigo-600 hover:underline dark:text-indigo-400" href={`/category/${c.slug}`}>{c.label} repos</Link></li>
          ))}
        </ul>
      </section>
    </>
  );
}
