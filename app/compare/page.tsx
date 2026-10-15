import { repoBlurb } from "@/lib/blurb";
import { ogDefaults } from "@/lib/seo";
import { PageNav } from "@/components/PageNav";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getData } from "@/lib/data";
import { categoryLabel } from "@/lib/categories";
import { ago, getLatestRelease } from "@/lib/activity";
import { getHnMentions } from "@/lib/mentions";
import { CompareView, type CompareRow } from "./CompareView";

export const metadata: Metadata = {
  title: "Compare GitHub repos side by side",
  description: "Compare up to 3 rising open-source AI and developer-tool repos: stars, growth, forks, language, releases, recent activity and Hacker News discussion.",
  alternates: { canonical: "/compare" },
  openGraph: { ...ogDefaults, url: "/compare" },
};

export default function ComparePage() {
  const data = getData();
  const now = Date.parse(data.generatedAt);
  const rows: CompareRow[] = data.repos.map((r) => {
    const rel = getLatestRelease(r.fullName);
    const hn = getHnMentions(r.fullName);
    return {
      fullName: r.fullName, owner: r.owner, name: r.name, description: repoBlurb(r) ?? "", ownerAvatar: r.ownerAvatar,
      stars: r.stars, forks: r.forks, delta24h: r.delta24h, delta7d: r.delta7d, est: r.velocityEstimated,
      language: r.language, category: categoryLabel(r.category), created: ago(r.createdAt, now), pushed: ago(r.pushedAt, now),
      release: rel ? `${rel.tag} (${ago(rel.date, now)})` : rel === null ? "None" : "—",
      hn: hn ? (hn.count ? `${hn.count} stories, ${hn.points.toLocaleString("en-US")} points` : "None") : "—",
    };
  });
  return (
    <div>
      <PageNav crumbs={[{ name: "Compare" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Compare</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Compare repos side by side</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Pick up to 3 tracked repos to see how they stack up on popularity (stars), momentum (stars gained recently), and maintenance (releases and code pushes).
      </p>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Loading…</p>}>
        <CompareView rows={rows} />
      </Suspense>
    </div>
  );
}
