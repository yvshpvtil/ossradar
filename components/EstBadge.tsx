export function EstBadge() {
  return (
    <span
      className="ml-1 rounded bg-zinc-200 px-1 py-px align-middle text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      title="Estimated: not enough daily snapshots yet, so this is total stars ÷ repo age (or extrapolated from partial history)."
    >
      est.
    </span>
  );
}

export function EstimateNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-zinc-500 dark:text-zinc-400 ${className}`}>
      <EstBadge /> means the star gain is <strong>estimated</strong>, not measured: until OSS Radar has
      collected enough daily snapshots for a repo, we use total stars ÷ days since creation (or extrapolate
      from the snapshots we do have). Estimates are replaced by measured deltas automatically as history builds up.
    </p>
  );
}
