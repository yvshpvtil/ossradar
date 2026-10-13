import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const NAV: { href: string; label: string; desktopOnly?: boolean }[] = [
  { href: "/", label: "Leaderboard", desktopOnly: true },
  { href: "/watchlist", label: "★ Watchlist" },
  { href: "/sponsor", label: "Sponsor" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" aria-hidden width={28} height={28} className="h-7 w-7" />
          OSS Radar
        </Link>
        <nav aria-label="Main" className="flex min-w-0 items-center gap-0.5 text-sm sm:gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${item.desktopOnly ? "hidden sm:inline-block" : ""} whitespace-nowrap rounded-md px-1.5 py-1.5 sm:px-2.5 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100`}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
