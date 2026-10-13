import Link from "next/link";

/**
 * Sponsor placement. Swap the placeholder for a real sponsor by passing props
 * (or wiring this to a sponsors.json file) once a slot is sold.
 */
export function SponsorSlot({
  variant = "bar",
  sponsor,
}: {
  variant?: "bar" | "card";
  sponsor?: { name: string; tagline: string; url: string };
}) {
  const href = sponsor?.url ?? "/sponsor";
  const text = sponsor ? (
    <>
      <strong className="font-semibold">{sponsor.name}</strong>: {sponsor.tagline}
    </>
  ) : (
    <>
      <strong className="font-semibold">Your product here</strong>, sponsor OSS Radar
    </>
  );

  if (variant === "card") {
    return (
      <aside className="rounded-lg border border-dashed border-amber-400/70 bg-amber-50 p-4 text-sm dark:border-amber-500/40 dark:bg-amber-950/30">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Sponsor
        </p>
        <p className="text-zinc-800 dark:text-zinc-200">{text}</p>
        <Link href={href} className="mt-2 inline-block text-amber-700 underline-offset-2 hover:underline dark:text-amber-400">
          {sponsor ? "Learn more →" : "Reach developers who track rising OSS →"}
        </Link>
      </aside>
    );
  }

  return (
    <div className="border-b border-amber-300/60 bg-amber-50 text-sm dark:border-amber-500/20 dark:bg-amber-950/30">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-2 text-center">
        <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          Sponsor
        </span>
        <Link href={href} className="text-zinc-800 hover:underline dark:text-zinc-200">
          {text} →
        </Link>
      </div>
    </div>
  );
}
