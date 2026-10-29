import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { LANDINGS } from "@/lib/landing";
import { getLanguages } from "@/lib/languages";
import { getArchiveDays } from "@/lib/daily";
import { getTopics } from "@/lib/topics";
import { alternativesPath, getAlternativesRepos } from "@/lib/alternatives";
import { alternativesLastmod, repoLastmod } from "@/lib/lastmod";
import { isThinRepo } from "@/lib/thin";

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
    { url: `${SITE.url}/compare`, lastModified, changeFrequency: "daily", priority: 0.5 },
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
      lastModified: alternativesLastmod(r, lastModified),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
