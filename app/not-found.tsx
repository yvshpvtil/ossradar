import Link from "next/link";
import { PageNav } from "@/components/PageNav";

export default function NotFound() {
  return (
    <>
    <PageNav crumbs={[{ name: "Not found" }]} />
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Not on the radar</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        We couldn&apos;t find that page. The repo may have dropped out of today&apos;s tracked set.
      </p>
      <Link href="/" className="mt-6 inline-block text-indigo-600 hover:underline dark:text-indigo-400">
        Back to the leaderboard
      </Link>
    </div>
    </>
  );
}
