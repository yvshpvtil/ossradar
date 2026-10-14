import type { Metadata } from "next";
import { PageNav } from "@/components/PageNav";
import { WatchlistView } from "@/components/WatchlistView";
import { getData } from "@/lib/data";
import { toLeaderRepo } from "@/lib/leader";

export const metadata: Metadata = {
  title: "Your watchlist",
  description: "Repos you're watching on OSS Radar, with current stars and recent gains. Saved in your browser, no login.",
  alternates: { canonical: "/watchlist" },
  robots: { index: false, follow: true },
};

export default function WatchlistPage() {
  const data = getData();
  return (
    <>
      <PageNav crumbs={[{ name: "Watchlist" }]} fallbackHref={"/"} />
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your watchlist</h1>
      <p className="mt-2 mb-6 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Tap ☆ on any repo to watch it. Your list lives in this browser only: no account, nothing sent to us.
      </p>
      <WatchlistView repos={data.repos.map(toLeaderRepo)} showMovement={Boolean(data.rankBaseDate)} />
    </>
  );
}
