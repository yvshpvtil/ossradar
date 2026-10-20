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
    return withScheme;
  } catch {
    return null;
  }
}
