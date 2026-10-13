import type { HistoryPoint } from "@/lib/types";

/** Inline SVG star-history sparkline. Renders a flat dashed line when there is <2 points. */
export function Sparkline({
  points,
  width = 120,
  height = 32,
  className,
  title,
}: {
  points: HistoryPoint[] | number[];
  width?: number;
  height?: number;
  className?: string;
  title?: string;
}) {
  const values = points.map((p) => (typeof p === "number" ? p : p.stars));
  const pad = 2;
  if (values.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={title ?? "Not enough history yet"}>
        <title>{title ?? "Not enough history yet"}</title>
        <line x1={pad} x2={width - pad} y1={height / 2} y2={height / 2} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="3 3" strokeWidth={1.5} />
        {values.length === 1 && <circle cx={width - pad - 1} cy={height / 2} r={2} fill="currentColor" />}
      </svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (width - pad * 2) / (values.length - 1);
  const coords = values.map((v, i) => [pad + i * step, height - pad - ((v - min) / range) * (height - pad * 2)] as const);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${height} L${coords[0][0].toFixed(1)},${height} Z`;
  const [lx, ly] = coords[coords.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={title ?? "Star history"}>
      <title>{title ?? "Star history"}</title>
      <path d={area} fill="currentColor" fillOpacity={0.12} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={2} fill="currentColor" />
    </svg>
  );
}
