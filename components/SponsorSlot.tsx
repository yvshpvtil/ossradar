import { getData } from "@/lib/data";
import { getActiveSponsor, type Sponsor } from "@/lib/sponsors";

/** Sponsor bar (top of every page) or card. Renders nothing unless data/sponsors.json has an active sponsor. */
export function SponsorSlot({ variant = "bar", sponsor: preview }: { variant?: "bar" | "card"; sponsor?: Sponsor }) {
  // "Now" = data build time (rebuilt hourly), so prerendering stays deterministic.
  const sponsor = preview ?? getActiveSponsor(new Date(getData().generatedAt));
  if (!sponsor) return null;
  const logo = sponsor.logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={sponsor.logo} alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded object-contain" />
  ) : null;
  const link = { href: sponsor.url, rel: "sponsored noopener", target: "_blank" };

  if (variant === "card") {
    return (
      <aside className="rounded-lg border border-amber-300/70 bg-amber-50 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-950/30">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">Sponsor</p>
        <p className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">{logo}{sponsor.name}</p>
        <p className="mt-1 text-zinc-700 dark:text-zinc-300">{sponsor.tagline}</p>
        <a {...link} className="mt-2 inline-block text-amber-800 underline-offset-2 hover:underline dark:text-amber-400">
          Visit {sponsor.name} →
        </a>
      </aside>
    );
  }

  return (
    <div className="border-b border-amber-300/60 bg-amber-50 text-sm dark:border-amber-500/20 dark:bg-amber-950/30">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center sm:px-6">
        <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-500/20 dark:text-amber-300">
          Sponsor
        </span>
        {logo}
        <a {...link} className="text-zinc-800 hover:underline dark:text-zinc-200">
          <strong className="font-semibold">{sponsor.name}</strong>: {sponsor.tagline} →
        </a>
      </div>
    </div>
  );
}
