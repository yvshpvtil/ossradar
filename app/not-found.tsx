import type { Metadata } from "next";
import Link from "next/link";
import { PageNav } from "@/components/PageNav";
import { NotFoundRepoHint } from "@/components/NotFoundRepoHint";
import { CATEGORIES } from "@/lib/categories";
import { LANDINGS } from "@/lib/landing";

// Override the root layout's robots (index, follow) so it doesn't conflict with
// Next.js's automatic <meta name="robots" content="noindex"/> on 404 responses.
export const metadata: Metadata = {
  title: "Page not found",
  description: "That page isn't on OSS Radar. The repo may have dropped out of today's tracked set, or the URL may be wrong.",
  robots: { index: false, follow: true },
};

const chip =
  "rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-indigo-400";

export default function NotFound() {
  return (
    <>
    <PageNav crumbs={[{ name: "Not found" }]} />
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Not on the radar</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        We couldn&apos;t find that page. The repo may have dropped out of today&apos;s tracked set.
      </p>
      <NotFoundRepoHint />
      <Link href="/" className="mt-6 inline-block text-indigo-600 hover:underline dark:text-indigo-400">
        Back to the leaderboard
      </Link>

      <div className="mx-auto mt-12 max-w-2xl space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-500">Browse rising repos by category</h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className={`inline-block ${chip}`}>{c.label}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-500">Or try one of these</h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {LANDINGS.map((l) => (
              <li key={l.slug}>
                <Link href={`/trending/${l.slug}`} className={`inline-block ${chip}`}>{l.navLabel}</Link>
              </li>
            ))}
            <li><Link href="/new" className={`inline-block ${chip}`}>New repos</Link></li>
            <li><Link href="/daily" className={`inline-block ${chip}`}>Daily top 25 archive</Link></li>
            <li><Link href="/alternatives" className={`inline-block ${chip}`}>Open-source alternatives</Link></li>
          </ul>
        </section>
      </div>
    </div>
    </>
  );
}
