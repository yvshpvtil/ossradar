import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { SubscribeButton } from "./NewsletterForm";

export function Footer() {
  const data = getData();
  return (
    <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <SubscribeButton />
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold">Categories</p>
          <ul className="space-y-1">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-zinc-600 hover:underline dark:text-zinc-400">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-2 px-4 pb-8 text-xs text-zinc-500">
        <p>
          Data from the GitHub API, updated hourly. Last update {formatDate(data.generatedAt)}. Not affiliated with GitHub.
        </p>
        <p>
          Built by <a href={SITE.github} className="hover:underline">{SITE.owner}</a> ·{" "}
          <Link href="/about" className="hover:underline">About</Link> ·{" "}
          <Link href="/sponsor" className="hover:underline">Sponsor</Link> ·{" "}
          <a href="/rss.xml" className="hover:underline">RSS</a>
        </p>
      </div>
    </footer>
  );
}
