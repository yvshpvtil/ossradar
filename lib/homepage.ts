/**
 * GitHub's homepage field is free text: some repos store a bare domain like "solidcraft.io" or
 * "www.opensidian.org". Rendered as-is in <a href>, that resolves relative to the repo page
 * (/repo/owner/solidcraft.io), a broken internal link. Return an absolute http(s) URL, or null.
 */
export function cleanHomepage(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s)
    ? s
    : /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]\S*)?$/i.test(s)
      ? `https://${s}`
      : null;
  if (!withScheme) return null;
  try {
    const u = new URL(withScheme);
    if ((u.protocol !== "https:" && u.protocol !== "http:") || !u.hostname.includes(".")) return null;
    return stripTracking(u) ?? withScheme;
  } catch {
    return null;
  }
}

/** Campaign tags (utm_*, click ids) and "came from GitHub" referral tags that say nothing about the page. */
const TRACKING_PARAM = /^(?:utm_[a-z_]+|gclid|fbclid|mc_cid|mc_eid)$/i;
const REFERRAL_PARAM = /^(?:ref|ref_src|source|src|via)$/i;

/**
 * The homepage without tracking query params ("https://routerhub.si/?utm_source=github&..." becomes
 * "https://routerhub.si/"), so sameAs and the Website link point at the site's canonical address.
 * Returns undefined when there is nothing to strip, so the original spelling is kept.
 */
function stripTracking(u: URL): string | undefined {
  const drop = [...u.searchParams.entries()].filter(
    ([k, v]) => TRACKING_PARAM.test(k) || (REFERRAL_PARAM.test(k) && /github/i.test(v)),
  );
  if (!drop.length) return undefined;
  for (const [k] of drop) u.searchParams.delete(k);
  return u.href;
}
