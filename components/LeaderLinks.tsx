import Link from "next/link";
import { altLabel } from "@/lib/alternatives";
import { formatDelta } from "@/lib/format";
import type { Repo } from "@/lib/types";

/**
 * "Leading this week" links in a hub's lede: each repo by the name people search for
 * (altLabel: brand spelling, owner/name only for generic or duplicate names) with its
 * weekly star gain, so the anchor text describes the target page and the sentence says
 * how far ahead each leader is, matching the hub's meta description.
 */
export function LeaderLinks({ repos }: { repos: Repo[] }) {
  return (
    <>
      {repos.map((r, i) => (
        <span key={r.fullName}>
          {i > 0 && (i === repos.length - 1 ? " and " : ", ")}
          <Link className="underline" href={`/repo/${r.owner}/${r.name}`} title={r.fullName}>{altLabel(r)}</Link>{" "}
          ({formatDelta(r.delta7d)}{i === 0 ? " stars" : ""})
        </span>
      ))}
    </>
  );
}
