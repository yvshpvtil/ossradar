export function EstBadge() {
  return (
    <span
      className="ml-1 inline-block rounded bg-zinc-200 px-1 py-px leading-tight align-middle text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      title="Estimated: not enough daily snapshots yet, so this is total stars ÷ repo age (or extrapolated from partial history)."
    >
      est.
    </span>
  );
}

export function EstimateNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-zinc-500 dark:text-zinc-400 ${className}`}>
      <span className="font-mono text-zinc-400">*</span> / <EstBadge /> Estimated: until we have enough daily snapshots
      for a repo, its gain is total stars ÷ days since creation. Measured numbers replace estimates automatically.
    </p>
  );
}
