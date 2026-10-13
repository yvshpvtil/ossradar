import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { LANDINGS } from "@/lib/landing";
import { getLanguages } from "@/lib/languages";
import { getArchiveDays } from "@/lib/daily";

export default function sitemap(): MetadataRoute.Sitemap {
  const data = getData();
  const lastModified = new Date(data.generatedAt);
  return [
    { url: SITE.url, lastModified, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE.url}/new`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE.url}/sponsor`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.url}/daily`, lastModified, changeFrequency: "daily", priority: 0.7 },
    ...getArchiveDays().map((d) => ({ url: `${SITE.url}/daily/${d}`, changeFrequency: "yearly" as const, priority: 0.5 })),
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
    ...LANDINGS.map((l) => ({
      url: `${SITE.url}/trending/${l.slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...data.repos.map((r) => ({
      url: `${SITE.url}/repo/${r.owner}/${r.name}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
