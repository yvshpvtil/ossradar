import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { LANDINGS } from "@/lib/landing";

export default function sitemap(): MetadataRoute.Sitemap {
  const data = getData();
  const lastModified = new Date(data.generatedAt);
  return [
    { url: SITE.url, lastModified, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE.url}/sponsor`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.url}/about`, changeFrequency: "monthly", priority: 0.4 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE.url}/category/${c.slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
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
