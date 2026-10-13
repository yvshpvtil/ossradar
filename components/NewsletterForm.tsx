import Link from "next/link";
import { BeehiivEmbed } from "./BeehiivEmbed";

/** In-place Beehiiv signup. Use once per page (hero / about); elsewhere use <SubscribeButton/>. */
export function NewsletterForm() {
  return (
    <div id="subscribe" className="scroll-mt-24">
      <BeehiivEmbed />
    </div>
  );
}

/** Footer CTA: jumps to the in-page form when present, else to the home hero form. */
export function SubscribeButton() {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="font-semibold">Get the weekly radar</p>
      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
        The fastest-rising AI &amp; dev-tool repos of the week, one line each. Free, no spam.
      </p>
      <Link href="/#subscribe" className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
        Subscribe free
      </Link>
    </div>
  );
}
