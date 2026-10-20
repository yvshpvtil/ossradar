import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { LANDINGS } from "@/lib/landing";
import { getLanguages } from "@/lib/languages";
import { getArchiveDays } from "@/lib/daily";
import { getTopics } from "@/lib/topics";
import { alternativesPath, getAlternativesRepos } from "@/lib/alternatives";
import type { Repo } from "@/lib/types";
import { isThinRepo } from "@/lib/thin";

/** Last day the repo's data actually changed (latest snapshot with a different star count), else its last code push. */
function repoLastmod(r: Repo, fallback: Date): Date {
  const h = r.history;
  for (let i = h.length - 1; i > 0; i--) if (h[i].stars !== h[i - 1].stars) return new Date(`${h[i].date}T23:59:59Z`) > fallback ? fallback : new Date(`${h[i].date}T23:59:59Z`);
  const p = new Date(r.pushedAt);
  return p > fallback ? fallback : p;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const data = getData();
  const lastModified = new Date(data.generatedAt);
  return [
    { url: SITE.url, lastModified, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE.url}/new`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE.url}/sponsor`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.url}/daily`, lastModified, changeFrequency: "daily", priority: 0.7 },
    ...getArchiveDays().map((d) => ({ url: `${SITE.url}/daily/${d}`, lastModified: new Date(`${d}T23:59:59Z`), changeFrequency: "yearly" as const, priority: 0.5 })),
    { url: `${SITE.url}/hacker-news`, lastModified, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE.url}/alternatives`, lastModified, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE.url}/topic`, lastModified, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE.url}/category`, lastModified, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE.url}/language`, lastModified, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE.url}/compare`, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE.url}/submit`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE.url}/about`, changeFrequency: "monthly", priority: 0.4 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE.url}/category/${c.slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...getLanguages().map((l) => ({
      url: `${SITE.url}/language/${l.slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...getTopics().map((t) => ({
      url: `${SITE.url}/topic/${encodeURIComponent(t.slug)}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...LANDINGS.map((l) => ({
      url: `${SITE.url}/trending/${l.slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...data.repos.filter((r) => !isThinRepo(r)).map((r) => ({
      url: `${SITE.url}/repo/${r.owner}/${r.name}`,
      lastModified: repoLastmod(r, lastModified),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...getAlternativesRepos().map((r) => ({
      url: `${SITE.url}${alternativesPath(r)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
