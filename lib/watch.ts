"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "ossr:watchlist";
const EVT = "ossr:watchlist";
const EMPTY: string[] = [];
let cache: { raw: string | null; list: string[] } = { raw: null, list: EMPTY };

function read(): string[] {
  const raw = localStorage.getItem(KEY);
  if (raw !== cache.raw) {
    try {
      cache = { raw, list: raw ? (JSON.parse(raw) as string[]) : EMPTY };
    } catch {
      cache = { raw, list: EMPTY };
    }
  }
  return cache.list;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Watchlist of repo full names, persisted in localStorage and synced across tabs. */
export function useWatchlist() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((fullName: string) => {
    const cur = read();
    const next = cur.includes(fullName) ? cur.filter((n) => n !== fullName) : [...cur, fullName];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVT));
  }, []);
  return { list, toggle, has: (n: string) => list.includes(n) };
}

const VISIT_KEY = "ossr:lastVisit";
interface Visit {
  /** generatedAt of the data the visitor last saw. */
  dataAt: string;
  seen: string[];
}

/**
 * Repos that weren't in the list the visitor saw last time. Returns null on a first visit
 * (nothing to compare against). The stored baseline only moves forward once the data has changed,
 * so reloading the same build keeps the highlight.
 */
export function readSinceLastVisit(dataAt: string, current: string[]): { newNames: Set<string>; since: string } | null {
  let prev: (Visit & { prev?: Visit }) | null = null;
  try {
    prev = JSON.parse(localStorage.getItem(VISIT_KEY) ?? "null");
  } catch {
    prev = null;
  }
  let base: Visit | undefined;
  if (!prev) {
    localStorage.setItem(VISIT_KEY, JSON.stringify({ dataAt, seen: current }));
    return null;
  }
  if (prev.dataAt === dataAt) {
    base = prev.prev; // same data as last time: keep comparing with the visit before
  } else {
    base = { dataAt: prev.dataAt, seen: prev.seen };
    localStorage.setItem(VISIT_KEY, JSON.stringify({ dataAt, seen: current, prev: base }));
  }
  if (!base) return null;
  const seen = new Set(base.seen);
  return { newNames: new Set(current.filter((n) => !seen.has(n))), since: base.dataAt };
}
