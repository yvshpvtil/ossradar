import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/BackNav";
import { notFound } from "next/navigation";
import { EstimateNote } from "@/components/EstBadge";
import { Leaderboard } from "@/components/Leaderboard";
import { HubIndex } from "@/components/HubIndex";
import { HubAlternatives } from "@/components/HubAlternatives";
import { JsonLd } from "@/components/JsonLd";
import { getData, rankRepos } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { getLanguage, getLanguages, getReposByLanguage } from "@/lib/languages";
import { hubLeaderProps } from "@/lib/leader";
import { relatedTopics } from "@/lib/topics";
import { RelatedTopics } from "@/components/RelatedTopics";
import { breadcrumbLd, collectionPageLd, hubDescription, itemListLd, pageAlternates } from "@/lib/seo";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return getLanguages().map((l) => ({ slug: l.slug }));
}

function languageMeta(lang: NonNullable<ReturnType<typeof getLanguage>>) {
  // <title> stays short (Google cuts around 60 chars); the live count lives in the
  // description and in the OG/X title, where length matters less.
  const title = `Trending ${lang.name} repos on GitHub`;
  const socialTitle = `${title}: ${lang.count} rising projects`;
  const leader = rankRepos(getReposByLanguage(lang.name), "week")[0];
  const description = hubDescription(`The fastest-rising open-source ${lang.name} AI and developer-tool repos on GitHub, ranked by stars gained.`, [`${lang.count} tracked, updated hourly on ${SITE.name}.`, `${lang.count} tracked, updated hourly.`, `${lang.count} tracked.`], leader);
  return { title, socialTitle, description };
}

export async function generateMetadata({ params }: PageProps<"/language/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lang = getLanguage(slug);
  if (!lang) return {};
  const { title, socialTitle, description } = languageMeta(lang);
  return {
    title,
    description,
    alternates: pageAlternates(`/language/${slug}`),
    openGraph: { title: socialTitle, description, url: `/language/${slug}` },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  };
}

export default async function LanguagePage({ params }: PageProps<"/language/[slug]">) {
  const { slug } = await params;
  const lang = getLanguage(slug);
  if (!lang) notFound();
  const repos = getReposByLanguage(lang.name);
  const ranked = rankRepos(repos, "week");
  const top = ranked.slice(0, 3);
  const weekTotal = repos.reduce((n, r) => n + r.delta7d, 0);
  const path = `/language/${slug}`;
  const others = getLanguages();
  return (
    <>
      <JsonLd data={collectionPageLd({ name: languageMeta(lang).title, description: languageMeta(lang).description, path, dateModified: getData().generatedAt, ogCard: true, mainEntity: itemListLd(`Fastest-rising ${lang.name} repos`, ranked) })} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Languages", path: "/language" }, { name: lang.name, path }])} />
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <BackButton fallbackHref="/" />
        <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-zinc-500">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/language" className="hover:underline">Languages</Link> / <span className="text-zinc-700 dark:text-zinc-300">{lang.name}</span>
        </nav>
      </div>
      <section className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Language</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Trending {lang.name} repos</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Open-source AI and developer tools written mainly in {lang.name} (the main language GitHub detects in the code), ranked by how many stars they gained.
        </p>
        {top.length > 0 && (
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            {repos.length} {lang.name} repos gained about {formatNumber(weekTotal)} stars in the last 7 days. Leading this week:{" "}
            {top.map((r, i) => (
              <span key={r.fullName}>
                {i > 0 && (i === top.length - 1 ? " and " : ", ")}
                <Link className="underline" href={`/repo/${r.owner}/${r.name}`}>{r.fullName}</Link>
              </span>
            ))}
            .
          </p>
        )}
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{repos.length} repos tracked · ranked by stars gained · updated hourly</p>
        <RelatedTopics topics={relatedTopics(repos, { exclude: lang.slug })} />
      </section>
      <nav aria-label="Languages" className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none]">
        <ul className="flex gap-2 pb-1 lg:flex-wrap">
          {others.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/language/${l.slug}`}
                aria-current={l.slug === slug ? "page" : undefined}
                className={`inline-block shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-sm ${
                  l.slug === slug
                    ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                {l.name} <span className="tabular-nums">{l.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <h2 id="leaderboard" className="mb-3 scroll-mt-6 text-xl font-semibold tracking-tight">{lang.name} leaderboard</h2>
      {repos.some((r) => r.velocityEstimated) && <EstimateNote className="mb-4" />}
      <Leaderboard {...hubLeaderProps(repos, "week", Date.parse(getData().generatedAt))} defaultPeriod="week" />
      <HubIndex repos={repos} label={lang.name} />
      <HubAlternatives repos={repos} label={lang.name} sameCategory={false} />
    </>
  );
}
