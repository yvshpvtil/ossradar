"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const DEPTH = "ossr-nav-depth";
export const RESTORE = "ossr-restore";

/** Flag the next list mount as a "came back" navigation; expires quickly so it can't leak into later visits. */
function markRestore() {
  sessionStorage.setItem(RESTORE, "1");
  setTimeout(() => sessionStorage.removeItem(RESTORE), 3000);
}

/** Counts in-site navigations this tab, and marks browser back/forward so lists can restore filters + scroll. */
export function NavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const seen = sessionStorage.getItem("ossr-nav-seen");
    if (seen !== null && seen !== pathname) sessionStorage.setItem(DEPTH, String(Number(sessionStorage.getItem(DEPTH) ?? 0) + 1));
    sessionStorage.setItem("ossr-nav-seen", pathname);
  }, [pathname]);
  useEffect(() => {
    const onPop = () => markRestore();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return null;
}

/**
 * "← Back": goes back in history when the visitor came from another OSS Radar page (keeping their
 * category, filters and scroll position); otherwise it's a plain link to `fallbackHref`.
 */
export function BackButton({ fallbackHref = "/", label = "Back" }: { fallbackHref?: string; label?: string }) {
  const router = useRouter();
  return (
    <Link
      href={fallbackHref}
      onClick={(e) => {
        if (Number(sessionStorage.getItem(DEPTH) ?? 0) > 0 && window.history.length > 1) {
          e.preventDefault();
          markRestore();
          router.back();
        }
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      <span aria-hidden>←</span> {label}
    </Link>
  );
}
