import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Leaderboard" },
  { href: "/watchlist", label: "★ Watchlist" },
  { href: "/sponsor", label: "Sponsor" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" aria-hidden width={28} height={28} className="h-7 w-7" />
          OSS Radar
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-2 py-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="/rss.xml"
            className="hidden rounded px-2 py-1 text-zinc-600 hover:text-zinc-900 sm:inline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            RSS
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
