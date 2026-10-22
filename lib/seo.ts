import type { Repo } from "./types";
import { formatDelta } from "./format";
import { SITE } from "./site";

export const abs = (path: string) => `${SITE.url}${path === "/" ? "" : path}`;
export const repoPath = (r: Pick<Repo, "owner" | "name">) => `/repo/${r.owner}/${r.name}`;

/** <title> for a repo page. The layout template appends " · OSS Radar" (12 chars);
 *  keep the rendered title around Google's ~60-char SERP limit. Prefer owner/name;
 *  drop the owner when the full form would overflow. */
export function repoPageTitle(repo: Pick<Repo, "fullName" | "name" | "delta7d">): string {
  const delta = formatDelta(repo.delta7d);
  // Layout appends " · OSS Radar" (12 chars), so 48 keeps the rendered title within ~60.
  // Long repo names step down: drop the owner, then the word "stars", then the growth phrase.
  const options = [
    `${repo.fullName}: ${delta} stars this week`,
    `${repo.name}: ${delta} stars this week`,
    `${repo.name}: ${delta} this week`,
  ];
  return options.find((t) => t.length <= 48) ?? repo.name;
}

/** Alternatives page <title> sized for Google's ~60-char SERP limit (layout adds " · OSS Radar", 12 chars). */
export function alternativesPageTitle(repoName: string, count: number): string {
  const options = [
    `${count} open-source ${repoName} alternatives on GitHub`,
    `${count} open-source ${repoName} alternatives`,
    `Open-source ${repoName} alternatives`,
    `${repoName} alternatives`,
  ];
  return options.find((t) => t.length <= 48) ?? options[options.length - 1];
}

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

/** ItemList for listing pages whose rows aren't plain Repo objects (daily archive, Hacker News).
 *  Items keep the on-page order; url should be absolute. */
/** Strip @context so a JSON-LD node can be nested inside another. */
export function withoutContext<T extends Record<string, unknown>>(ld: T) {
  const out: Record<string, unknown> = { ...ld };
  delete out["@context"];
  return out;
}

export function linkListLd(name: string, items: { name: string; url: string }[], limit = 50) {
  const list = items.slice(0, limit);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: list.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: list.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: it.url, name: it.name })),
  };
}

/** CollectionPage wrapper for a hub/listing page: says what the page is, when its ranking was last
 *  rebuilt (the data snapshot time) and which site it belongs to, with the ranked list as mainEntity. */
export function collectionPageLd(o: { name: string; description: string; path: string; dateModified: string; mainEntity: Record<string, unknown> }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: o.name,
    description: o.description,
    url: abs(o.path),
    dateModified: o.dateModified,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: SITE.name, url: abs("/") },
    mainEntity: withoutContext(o.mainEntity),
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

// Pages that set their own `openGraph` replace the layout's object entirely, which drops the
// root file-based OG image (and siteName/locale/type). Spread these into any page without its own
// opengraph-image file so link previews on X/Slack/LinkedIn still show the card.
export const SITE_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE.name}: fastest-rising open-source AI & dev tools`,
  type: "image/png",
};
export const ogDefaults = { siteName: SITE.name, locale: "en_US", type: "website" as const, images: [SITE_OG_IMAGE] };
export const twitterImage = { images: [SITE_OG_IMAGE.url] };
