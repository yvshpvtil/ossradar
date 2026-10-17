"use client";

import { useEffect, useState } from "react";

const REPO_PATH = /^\/(?:repo|alternatives)\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?$/;

/**
 * On a 404 for /repo/{owner}/{name} or /alternatives/{owner}/{name} (usually a repo that
 * dropped out of the tracked set since a newsletter or post linked it), point to the repo
 * on GitHub so the visitor still reaches what they came for. The 404 page is prerendered
 * (the proxy rewrites to it), so read the real URL after mount to avoid a hydration mismatch.
 */
export function NotFoundRepoHint() {
  const [pathname, setPathname] = useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only known in the browser
  useEffect(() => setPathname(window.location.pathname), []);
  const m = REPO_PATH.exec(pathname);
  if (!m) return null;
  const fullName = `${m[1]}/${m[2]}`;
  return (
    <p className="mt-4 text-zinc-600 dark:text-zinc-400">
      <span className="font-medium text-zinc-800 dark:text-zinc-200">{fullName}</span> isn&apos;t in the current tracked set.{" "}
      <a
        href={`https://github.com/${fullName}`}
        rel="noopener"
        className="text-indigo-600 hover:underline dark:text-indigo-400"
      >
        View {fullName} on GitHub
      </a>
    </p>
  );
}
