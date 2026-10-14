"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

/**
 * One delegated click listener → Vercel Analytics custom events:
 *   repo_open (internal link to a repo page), outbound_github (link to github.com), compare (link to /compare).
 * "subscribe" is sent by NewsletterForm on success.
 */
export function EngagementTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, location.href);
      const from = location.pathname.split("/")[1] || "home";
      if (url.hostname === "github.com") track("outbound_github", { repo: url.pathname.split("/").slice(1, 3).join("/"), from });
      else if (url.origin === location.origin && url.pathname.startsWith("/repo/")) track("repo_open", { repo: url.pathname.slice(6), from });
      else if (url.origin === location.origin && url.pathname === "/compare") track("compare", { from });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
