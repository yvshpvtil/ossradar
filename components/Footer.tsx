import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { getLanguages } from "@/lib/languages";
import { LANDINGS } from "@/lib/landing";
import { formatDate } from "@/lib/format";
import { SubscribeButton } from "./NewsletterForm";

export function Footer() {
  const data = getData();
  return (
    <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <SubscribeButton />
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold">Trending</p>
          <ul className="space-y-1">
            {LANDINGS.map((l) => (
              <li key={l.slug}>
                <Link href={`/trending/${l.slug}`} className="text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100">
                  {l.navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold"><Link href="/category" className="hover:underline">Categories</Link></p>
          <ul className="space-y-1">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold">Languages</p>
          <ul className="space-y-1">
            {getLanguages().slice(0, 8).map((l) => (
              <li key={l.slug}>
                <Link href={`/language/${l.slug}`} className="text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100">
                  {l.name} repos
                </Link>
              </li>
            ))}
            <li>
              <Link href="/language" className="text-indigo-700 hover:underline dark:text-indigo-300">
                {`All ${getLanguages().length} languages →`}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-x-6 gap-y-2 border-t border-zinc-100 px-4 pb-8 pt-6 sm:px-6 dark:border-zinc-900 text-xs text-zinc-500">
        <p>
          Data from the GitHub API, updated hourly. Last update {formatDate(data.generatedAt)}. Not affiliated with GitHub.
        </p>
        <p>
          Built by <a href={SITE.github} className="hover:underline">{SITE.owner}</a> ·{" "}
          <Link href="/new" className="hover:underline">New repos</Link> ·{" "}
          <Link href="/daily" className="hover:underline">Daily archive</Link> ·{" "}
          <Link href="/hacker-news" className="hover:underline">On Hacker News</Link> ·{" "}
          <Link href="/compare" className="hover:underline">Compare repos</Link> ·{" "}
          <Link href="/alternatives" className="hover:underline">Alternatives</Link> ·{" "}
          <Link href="/category" className="hover:underline">Categories</Link> ·{" "}
          <Link href="/topic" className="hover:underline">Topics</Link> ·{" "}
          <Link href="/language" className="hover:underline">Languages</Link> ·{" "}
          <Link href="/submit" className="hover:underline">Submit a repo</Link> ·{" "}
          <Link href="/about" className="hover:underline">About</Link> ·{" "}
          <Link href="/sponsor" className="hover:underline">Sponsor</Link> ·{" "}
          <a href="/rss.xml" className="hover:underline">RSS</a>
        </p>
      </div>
    </footer>
  );
}
