import Link from "next/link";
import { BackButton } from "./BackNav";

/** Back button + visual breadcrumb used at the top of every non-home page. Last crumb is the current page (no href). */
export function PageNav({ crumbs, fallbackHref = "/" }: { crumbs: { name: string; href?: string }[]; fallbackHref?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <BackButton fallbackHref={fallbackHref} />
      <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-zinc-500">
        <Link href="/" className="hover:underline">Home</Link>
        {crumbs.map((c, i) => (
          <span key={i}>
            {" / "}
            {c.href ? (
              <Link href={c.href} className="hover:underline">{c.name}</Link>
            ) : (
              <span aria-current="page" className="break-words text-zinc-700 dark:text-zinc-300">{c.name}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
