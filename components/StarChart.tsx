import { areaPath, linePath, svgNum } from "@/lib/svgPath";
/** Server-rendered line chart of star counts with min/max and start/end labels (no client JS). */
export function StarChart({ points, label, title }: { points: { x: string; stars: number }[]; label: (x: string) => string; title: string }) {
  const W = 640, H = 160, L = 56, R = 8, T = 10, B = 24;
  const ys = points.map((p) => p.stars);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const x = (i: number) => L + (points.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (points.length - 1));
  const y = (v: number) => T + (H - T - B) * (1 - (v - min) / (max - min));
  const coords = points.map((p, i) => [x(i), y(p.stars)] as const);
  const d = linePath(coords);
  const area = areaPath(d, coords, H - B);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full text-indigo-500">
      <title>{title}</title>
      {[max, min].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={svgNum(y(v))} y2={svgNum(y(v))} className="stroke-zinc-200 dark:stroke-zinc-800" strokeDasharray="3 3" />
          <text x={L - 6} y={svgNum(y(v) + 4)} textAnchor="end" className="fill-zinc-500 text-[11px] tabular-nums">{Math.round(v).toLocaleString("en-US")}</text>
        </g>
      ))}
      <path d={area} className="fill-indigo-500/10" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
      {/* Dots only on short series; long ones used to render every point as an invisible r=0 circle. */}
      {points.length <= 24 && points.map((p, i) => <circle key={p.x} cx={svgNum(x(i))} cy={svgNum(y(p.stars))} r={2.5} fill="currentColor" />)}
      <text x={L} y={H - 6} className="fill-zinc-500 text-[11px]">{label(points[0].x)}</text>
      <text x={W - R} y={H - 6} textAnchor="end" className="fill-zinc-500 text-[11px]">{label(points[points.length - 1].x)}</text>
    </svg>
  );
}
