import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageNav } from "@/components/PageNav";
import { CATEGORIES } from "@/lib/categories";
import { rankRepos } from "@/lib/data";
import { formatDelta } from "@/lib/format";
import { getLanguages, getReposByLanguage } from "@/lib/languages";
import { abs, breadcrumbLd, ogDefaults, repoPath, twitterImage } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Directory of every language hub. Before this, language hubs were linked only from the
// footer (top 8) and repo-page language chips, and bare /language 404'd.
const title = "Programming languages with rising GitHub repos";
const socialTitle = "Browse fast-rising open-source repos by programming language";
/** Matches getLanguages() default: hubs need at least this many tracked repos. */
const LANGUAGE_MIN = 5;

function rows() {
  return getLanguages().map((l) => {
    const repos = getReposByLanguage(l.name);
    return { ...l, week: repos.reduce((n, r) => n + r.delta7d, 0), top: rankRepos(repos, "week")[0] };
  });
}

export function generateMetadata(): Metadata {
  const n = getLanguages().length;
  const description = `All ${n} programming-language hubs on ${SITE.name}: each ranks the tracked open-source AI and developer-tool repos written mainly in that language by stars gained.`;
  return {
    title,
    description,
    alternates: { canonical: "/language" },
    openGraph: { ...ogDefaults, title: socialTitle, description, url: "/language" },
    twitter: { card: "summary_large_image", title: socialTitle, description, ...twitterImage },
  };
}

export default function LanguageIndex() {
  const rs = rows();
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Languages", path: "/language" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          url: abs("/language"),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: rs.length,
            itemListElement: rs.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/language/${l.slug}`), name: `${l.name} repos` })),
          },
        }}
      />
      <PageNav crumbs={[{ name: "Languages" }]} fallbackHref="/" />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Languages</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Browse rising repos by programming language</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Each language hub covers tracked open-source AI and developer-tool repos whose main language on GitHub is that language. {SITE.name} has a hub for each of
        the {rs.length} languages used by at least {LANGUAGE_MIN} tracked repos, ranking those repos by stars gained. Languages are listed by how many tracked repos
        use them, with the stars they gained together in the last 7 days and the repo leading this week.
      </p>
      <ul className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {rs.map((l) => (
          <li key={l.slug} className="min-w-0 break-words">
            <Link className="font-medium hover:underline" href={`/language/${l.slug}`}>{l.name} repos</Link>{" "}
            <span className="text-zinc-500">
              ({l.count}) · <span className="text-emerald-700 dark:text-emerald-400">{formatDelta(l.week)}/wk</span>
            </span>
            {l.top && (
              <span className="block text-xs text-zinc-500">
                Leading: <Link prefetch={false} className="hover:underline" href={repoPath(l.top)}>{l.top.fullName}</Link>
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Or browse by category:{" "}
        {CATEGORIES.map((c, i) => (
          <span key={c.slug}>
            {i > 0 && " · "}
            <Link className="underline" href={`/category/${c.slug}`}>{c.label}</Link>
          </span>
        ))}
        . Also see{" "}
        <Link className="underline" href="/topic">GitHub topics</Link>.
      </p>
    </div>
  );
}
