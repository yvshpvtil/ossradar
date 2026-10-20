import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EstimateNote } from "@/components/EstBadge";
import { Leaderboard } from "@/components/Leaderboard";
import { HubIndex } from "@/components/HubIndex";
import { CATEGORIES, getCategory } from "@/lib/categories";
import Link from "next/link";
import { BackButton } from "@/components/BackNav";
import { JsonLd } from "@/components/JsonLd";
import { getData, getReposByCategory, rankRepos } from "@/lib/data";
import { HomeSidebar } from "@/components/HomeSidebar";
import { CategoryChips } from "@/components/CategoryChips";
import { getNewRepos } from "@/lib/newRepos";
import { formatNumber } from "@/lib/format";
import { breadcrumbLd, clip, itemListLd } from "@/lib/seo";
import { toLeaderRepo } from "@/lib/leader";

/** Search-intent phrasing per category (what people actually type). */
const CATEGORY_SEO_TITLE: Record<string, string> = {
  // Distinct from the AI agents topic hub title, which this used to duplicate (/topic/ai-agent now redirects to /topic/ai-agents).
  "ai-agents": "Trending AI agent frameworks on GitHub",
  "llm-tooling": "Trending LLM tools & frameworks on GitHub",
  mcp: "Best MCP servers & tools on GitHub, by growth",
  "coding-agents": "Trending AI coding agents on GitHub",
  "rag-vector": "Trending RAG & vector database repos on GitHub",
  "local-llms": "Trending local LLM tools on GitHub",
  devops: "Trending open-source DevOps tools on GitHub",
  other: "Trending developer tools & AI projects on GitHub",
};

/**
 * Hand-written meta descriptions per category (natural phrasing, kept short so the
 * full sentence shows in search results). `{n}` is replaced with the live repo count.
 */
const CATEGORY_SEO_DESCRIPTION: Record<string, string> = {
  "ai-agents": "The {n} fastest-rising AI agent repos on GitHub: multi-agent frameworks, agent runtimes and orchestration, ranked by stars gained this week. Updated hourly.",
  "llm-tooling": "The {n} fastest-rising LLM tools on GitHub: SDKs, prompt tooling, evals, gateways, fine-tuning and inference libraries, ranked by weekly star growth.",
  mcp: "The {n} fastest-rising Model Context Protocol (MCP) servers, clients and tools on GitHub, ranked by stars gained this week. Updated hourly.",
  "coding-agents": "The {n} fastest-rising AI coding agents on GitHub: pair programmers, code-generation agents and IDE assistants, ranked by stars gained this week.",
  "rag-vector": "The {n} fastest-rising RAG and vector database repos on GitHub: retrieval, embeddings and search, ranked by stars gained this week. Updated hourly.",
  "local-llms": "The {n} fastest-rising tools for running LLMs on your own hardware: runtimes, quantization and desktop apps, ranked by weekly GitHub star growth.",
  devops: "The {n} fastest-rising open-source DevOps repos on GitHub: infrastructure, CI/CD, observability and containers, ranked by stars gained this week.",
  other: "The {n} fastest-rising developer tools and AI projects on GitHub that don't fit a single category, ranked by stars gained this week. Updated hourly.",
};

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const count = getReposByCategory(category.slug).length;
  // <title> stays short (Google cuts around 60 chars); the live count lives in the
  // description and in the OG/X title, where length matters less.
  const title = CATEGORY_SEO_TITLE[category.slug] ?? `Trending ${category.label} GitHub repos`;
  const socialTitle = `${title}: ${count} rising projects`;
  const template = CATEGORY_SEO_DESCRIPTION[category.slug];
  const description = clip(
    template
      ? template.replace("{n}", String(count))
      : `Fastest-rising open-source ${category.label} projects on GitHub, ranked by stars gained this week. ${category.description}`,
  );
  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}` },
    openGraph: { title: socialTitle, description, url: `/category/${slug}` },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const repos = getReposByCategory(category.slug);
  const ranked = rankRepos(repos, "week");
  const top = ranked.slice(0, 3);
  const weekTotal = repos.reduce((n, r) => n + r.delta7d, 0);
  const path = `/category/${category.slug}`;
  const all = getData().repos;
  const newCount = getNewRepos().reduce((n, g) => n + g.repos.length, 0);
  return (
    <>
      <JsonLd data={itemListLd(`Fastest-rising ${category.label} repos`, ranked)} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: category.label, path }])} />
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <HomeSidebar repos={all} newCount={newCount} active={category.slug} />
      <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <BackButton fallbackHref="/" />
        <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-zinc-500">
          <Link href="/" className="hover:underline">Home</Link> / <span className="text-zinc-700 dark:text-zinc-300">{category.label}</span>
        </nav>
      </div>
      <section className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Category</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Trending {category.label} repos</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">{category.description}</p>
        {top.length > 0 && (
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            OSS Radar tracks {repos.length} {category.label} repos that together gained about {formatNumber(weekTotal)} stars
            in the last 7 days. Leading this week:{" "}
            {top.map((r, i) => (
              <span key={r.fullName}>
                {i > 0 && (i === top.length - 1 ? " and " : ", ")}
                <Link className="underline" href={`/repo/${r.owner}/${r.name}`}>{r.fullName}</Link>
              </span>
            ))}
            .
          </p>
        )}
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{repos.length} repos tracked · ranked by stars gained this week · updated hourly</p>
      </section>
      <CategoryChips repos={all} active={category.slug} />
      {repos.some((r) => r.velocityEstimated) && <EstimateNote className="mb-4" />}
      <Leaderboard repos={repos.map(toLeaderRepo)} showCategoryFilter={false} defaultPeriod="week" />
      <HubIndex repos={repos} label={category.label} />
      </div>
      </div>
    </>
  );
}
