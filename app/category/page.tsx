import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageNav } from "@/components/PageNav";
import { CATEGORIES } from "@/lib/categories";
import { getData, getReposByCategory, rankRepos } from "@/lib/data";
import { formatDelta } from "@/lib/format";
import { abs, breadcrumbLd, ogDefaults, repoPath, twitterImage, websiteRef } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Directory of every category hub. Before this, bare /category 404'd and category hubs
// had no parent page in their breadcrumb, unlike the language and topic hubs.
const title = "Open-source AI & dev-tool categories, by growth";
const socialTitle = "Browse fast-rising open-source repos by category";

function rows() {
  return CATEGORIES.map((c) => {
    const repos = getReposByCategory(c.slug);
    const week = repos.reduce((n, r) => n + r.delta7d, 0);
    return { ...c, count: repos.length, week, avg: repos.length ? Math.round(week / repos.length) : 0, tops: rankRepos(repos, "week").slice(0, 3) };
  });
}

/** Plain-English summary of where this week's stars went across categories, built from the same rows as the list. */
function summary(rs: ReturnType<typeof rows>): string | null {
  const named = rs.filter((c) => c.slug !== "other" && c.count > 0);
  if (named.length < 2) return null;
  const total = rs.reduce((n, c) => n + c.week, 0);
  const repoTotal = rs.reduce((n, c) => n + c.count, 0);
  if (total <= 0 || repoTotal <= 0) return null;
  const pct = (n: number, d: number) => Math.round((n / d) * 100);
  const byWeek = [...named].sort((a, b) => b.week - a.week);
  const byAvg = [...named].sort((a, b) => b.avg - a.avg);
  const lead = byWeek[0];
  const top = lead.tops[0];
  let s = `${lead.label} repos gained the most stars together this week (${formatDelta(lead.week)}, ${pct(lead.week, total)}% of all stars gained by tracked repos), ${pct(lead.week, total) > pct(lead.count, repoTotal) ? "though they're only" : "and they make up"} ${pct(lead.count, repoTotal)}% of the ${repoTotal} tracked repos.`;
  if (top && lead.week > 0) s += ` ${top.fullName} alone accounts for ${pct(top.delta7d, lead.week)}% of that.`;
  if (byWeek[1]) s += ` ${byWeek[1].label} is second with ${formatDelta(byWeek[1].week)}.`;
  const avgLead = byAvg[0];
  if (avgLead.slug !== lead.slug) s += ` Per repo, ${avgLead.label} leads: its ${avgLead.count} repos averaged ${formatDelta(avgLead.avg)} stars each.`;
  else if (byAvg[1]) s += ` ${lead.label} also leads per repo at ${formatDelta(avgLead.avg)} stars each, ahead of ${byAvg[1].label} at ${formatDelta(byAvg[1].avg)}.`;
  const biggest = [...named].sort((a, b) => b.count - a.count)[0];
  if (biggest.slug !== lead.slug) s += ` By size, ${biggest.label} is the largest category with ${biggest.count} repos.`;
  return s;
}

export function generateMetadata(): Metadata {
  const description = `All ${CATEGORIES.length} category hubs on ${SITE.name}, from AI agents and MCP servers to local LLMs and DevOps, each ranking its tracked GitHub repos by stars gained.`;
  return {
    title,
    description,
    alternates: { canonical: "/category" },
    openGraph: { ...ogDefaults, title: socialTitle, description, url: "/category" },
    twitter: { card: "summary_large_image", title: socialTitle, description, ...twitterImage },
  };
}

export default function CategoryIndex() {
  const rs = rows();
  const sum = summary(rs);
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Categories", path: "/category" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          url: abs("/category"),
          dateModified: getData().generatedAt,
          inLanguage: "en",
          isPartOf: websiteRef,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: rs.length,
            itemListElement: rs.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/category/${c.slug}`), name: `${c.label} repos` })),
          },
        }}
      />
      <PageNav crumbs={[{ name: "Categories" }]} fallbackHref="/" />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Categories</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Browse rising repos by category</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {SITE.name} sorts every tracked open-source AI and developer-tool repo into one of {rs.length} categories, based on its GitHub topics and description. Each
        category hub ranks its repos by stars gained. Below are all {rs.length}, with how many repos each holds, the stars they gained together in the last 7 days
        and the three repos rising fastest this week.
      </p>
      <ul className="mt-6 grid gap-x-6 gap-y-5 text-sm sm:grid-cols-2">
        {rs.map((c) => (
          <li key={c.slug} className="min-w-0 break-words">
            <Link className="font-medium hover:underline" href={`/category/${c.slug}`}>{c.label} repos</Link>{" "}
            <span className="text-zinc-500">
              ({c.count}) · <span className="text-emerald-700 dark:text-emerald-400">{formatDelta(c.week)}/wk</span>
            </span>
            <span className="mt-0.5 block text-zinc-600 dark:text-zinc-400">{c.description}</span>
            {c.tops.length > 0 && (
              <span className="block text-xs text-zinc-500">
                Rising this week:{" "}
                {c.tops.map((r, i) => (
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
        <h2 className="text-lg font-semibold">How repos are sorted into categories</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Each repo goes into exactly one category. {SITE.name} scores every category against the repo&apos;s GitHub topics and the words in its name and
          description, and the highest score wins. The description counts for more than topics, since it&apos;s what the author says the repo actually is: a coding
          agent that also tags itself &quot;mcp&quot; stays a coding agent. Repos that match no category well land in Other. Because repos have one category,
          the counts above add up to every tracked repo.
        </p>
      </section>
      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Or browse by <Link className="underline" href="/language">programming language</Link> or{" "}
        <Link className="underline" href="/topic">GitHub topic</Link>.
      </p>
    </div>
  );
}
