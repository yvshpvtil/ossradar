import type { Metadata } from "next";
import { PageNav } from "@/components/PageNav";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EstimateNote } from "@/components/EstBadge";
import { JsonLd } from "@/components/JsonLd";
import { Leaderboard } from "@/components/Leaderboard";
import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { LANDINGS, getLanding } from "@/lib/landing";
import { hubLeaderProps } from "@/lib/leader";
import { breadcrumbLd, collectionPageLd, itemListLd, ogDefaults, pageAlternates } from "@/lib/seo";

export function generateStaticParams() {
  return LANDINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/trending/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const l = getLanding(slug);
  if (!l) return {};
  const url = `/trending/${l.slug}`;
  return {
    title: l.title,
    description: l.description,
    alternates: pageAlternates(url),
    // Images come from ./opengraph-image (a per-view card), so the generic site image is left out here.
    openGraph: { siteName: ogDefaults.siteName, locale: ogDefaults.locale, type: ogDefaults.type, title: l.title, description: l.description, url },
    twitter: { card: "summary_large_image", title: l.title, description: l.description },
  };
}

export default async function TrendingPage({ params }: PageProps<"/trending/[slug]">) {
  const { slug } = await params;
  const l = getLanding(slug);
  if (!l) notFound();
  const repos = l.select();
  const path = `/trending/${l.slug}`;
  return (
    <>
      <JsonLd data={collectionPageLd({ name: l.title, description: l.description, path, dateModified: getData().generatedAt, ogCard: true, mainEntity: itemListLd(l.h1, repos) })} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: l.title, path }])} />
      <PageNav crumbs={[{ name: l.title }]} />
      <section className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{l.h1}</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">{l.intro}</p>
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
