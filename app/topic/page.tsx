import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageNav } from "@/components/PageNav";
import { CATEGORIES } from "@/lib/categories";
import { getData, rankRepos } from "@/lib/data";
import { formatDelta } from "@/lib/format";
import { abs, breadcrumbLd, ogDefaults, repoPath, twitterImage } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { TOPIC_MIN, getReposByTopic, getTopics, topicLabel } from "@/lib/topics";

// Directory of every topic hub. Before this, topic hubs were linked only from repo-page
// chips, related-topic chips and the homepage's top-16 row, so smaller hubs sat 3 clicks deep.
const title = "GitHub topics with rising open-source repos";
const socialTitle = "Browse fast-rising open-source repos by GitHub topic";

function rows() {
  return getTopics().map((t) => {
    const repos = getReposByTopic(t.slug);
    return { ...t, label: topicLabel(t.slug), week: repos.reduce((n, r) => n + r.delta7d, 0), top: rankRepos(repos, "week")[0] };
  });
}

export function generateMetadata(): Metadata {
  const n = getTopics().length;
  const description = `All ${n} GitHub topic hubs on ${SITE.name}, from AI agents and MCP to self-hosted tools: each ranks the tracked repos tagged with that topic by stars gained.`;
  return {
    title,
    description,
    alternates: { canonical: "/topic" },
    openGraph: { ...ogDefaults, title: socialTitle, description, url: "/topic" },
    twitter: { card: "summary_large_image", title: socialTitle, description, ...twitterImage },
  };
}

export default function TopicIndex() {
  const rs = rows();
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Topics", path: "/topic" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          url: abs("/topic"),
          dateModified: getData().generatedAt,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: SITE.name, url: abs("/") },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: rs.length,
            itemListElement: rs.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/topic/${t.slug}`), name: `${t.label} repos` })),
          },
        }}
      />
      <PageNav crumbs={[{ name: "Topics" }]} fallbackHref="/" />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Topics</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Browse rising repos by GitHub topic</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        GitHub topics are labels maintainers add to describe what a project is about. {SITE.name} has a hub page for each of the {rs.length} topics used by at
        least {TOPIC_MIN} tracked repos (singular and plural spellings share one page), ranking those repos by stars gained. Topics are listed by how many tracked
        repos use them, with the stars they gained together in the last 7 days and the repo leading this week.
      </p>
      <ul className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {rs.map((t) => (
          <li key={t.slug} className="min-w-0 break-words">
            <Link className="font-medium hover:underline" href={`/topic/${t.slug}`}>{t.label} repos</Link>{" "}
            <span className="text-zinc-500">
              ({t.count}) · <span className="text-emerald-700 dark:text-emerald-400">{formatDelta(t.week)}/wk</span>
            </span>
            {t.top && (
              <span className="block text-xs text-zinc-500">
                Leading: <Link prefetch={false} className="hover:underline" href={repoPath(t.top)}>{t.top.fullName}</Link>
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
        .
      </p>
    </div>
  );
}
