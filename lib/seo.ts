import type { Repo } from "./types";
import { SITE } from "./site";

export const abs = (path: string) => `${SITE.url}${path === "/" ? "" : path}`;
export const repoPath = (r: Pick<Repo, "owner" | "name">) => `/repo/${r.owner}/${r.name}`;

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function itemListLd(name: string, repos: Repo[], limit = 50) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: Math.min(repos.length, limit),
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: repos.slice(0, limit).map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: abs(repoPath(r)),
      name: r.fullName,
    })),
  };
}

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  publisher: { "@type": "Organization", name: SITE.name, url: SITE.url, email: SITE.sponsorEmail },
};

/** Trim to a meta-description-friendly length on a word boundary. */
export function clip(s: string, max = 158): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
