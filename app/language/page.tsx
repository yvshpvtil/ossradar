import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageNav } from "@/components/PageNav";
import { CATEGORIES } from "@/lib/categories";
import { getData, rankRepos } from "@/lib/data";
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
    const week = repos.reduce((n, r) => n + r.delta7d, 0);
    return { ...l, week, avg: Math.round(week / repos.length), tops: rankRepos(repos, "week").slice(0, 3) };
  });
}

/** Plain-English summary of where this week's stars went, built from the same rows as the list. */
function summary(rs: ReturnType<typeof rows>): string | null {
  if (rs.length < 2) return null;
  const total = rs.reduce((n, l) => n + l.week, 0);
  const repoTotal = rs.reduce((n, l) => n + l.count, 0);
  if (total <= 0 || repoTotal <= 0) return null;
  const byWeek = [...rs].sort((a, b) => b.week - a.week);
  const byAvg = [...rs].sort((a, b) => b.avg - a.avg);
  const lead = byWeek[0];
  const pct = (n: number, d: number) => Math.round((n / d) * 100);
  let s = `${lead.name} repos gained the most stars together this week (${formatDelta(lead.week)}, ${pct(lead.week, total)}% of the stars gained across these ${rs.length} languages), ${pct(lead.week, total) > pct(lead.count, repoTotal) ? "though they're only" : "and they make up"} ${pct(lead.count, repoTotal)}% of the tracked repos in them.`;
  if (byWeek[1]) s += ` ${byWeek[1].name} is second with ${formatDelta(byWeek[1].week)}.`;
  const avgLead = byAvg[0];
  if (avgLead.slug !== lead.slug) s += ` Per repo, ${avgLead.name} leads: its ${avgLead.count} tracked repos averaged ${formatDelta(avgLead.avg)} stars each.`;
  else if (byAvg[1]) s += ` It also leads per repo at ${formatDelta(avgLead.avg)} stars each, ahead of ${byAvg[1].name} at ${formatDelta(byAvg[1].avg)}.`;
  return s;
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
  const sum = summary(rs);
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Languages", path: "/language" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          url: abs("/language"),
          dateModified: getData().generatedAt,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: SITE.name, url: abs("/") },
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
        use them, with the stars they gained together in the last 7 days and the three repos rising fastest this week.
      </p>
      <ul className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {rs.map((l) => (
          <li key={l.slug} className="min-w-0 break-words">
            <Link className="font-medium hover:underline" href={`/language/${l.slug}`}>{l.name} repos</Link>{" "}
            <span className="text-zinc-500">
              ({l.count}) · <span className="text-emerald-700 dark:text-emerald-400">{formatDelta(l.week)}/wk</span>
            </span>
            {l.tops.length > 0 && (
              <span className="block text-xs text-zinc-500">
                Rising this week:{" "}
                {l.tops.map((r, i) => (
                  <span key={r.fullName}>
                    {i > 0 && ", "}
                    <Link prefetch={false} className="hover:underline" href={repoPath(r)}>{r.fullName}</Link> ({formatDelta(r.delta7d)})
                  </span>
                ))}
              </span>
            )}
          </li>
        ))}
      </ul>
      {sum && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Where this week&apos;s stars went</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{sum}</p>
        </section>
      )}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">How languages are assigned</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          A repo&apos;s language is the main language GitHub detects for it, which is the language with the most code by size. A Python agent framework with a
          TypeScript web UI counts as Python if most of its code is Python. Repos without a detected language, and languages used by fewer than {LANGUAGE_MIN}{" "}
          tracked repos, still appear in the main rankings but don&apos;t get a language hub.
        </p>
      </section>
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
