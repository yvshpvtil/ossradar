/**
 * Compact SVG path data for the server-rendered charts. Each sparkline's path is in the HTML
 * twice (area + line) and again in the RSC payload, so on a 50-row leaderboard the verbose
 * "L4.7,25.3 L7.4,24.5 … L2.0,28 Z" form made up most of the ~45 KB of SVG markup on the homepage. One decimal, no trailing
 * ".0", implicit lineto after M, and V/H to close the area draw the identical shape.
 */
const num = (n: number) => String(Math.round(n * 10) / 10);

/** "M x y x y …" polyline through the points (implicit lineto after the first pair). */
export function linePath(coords: readonly (readonly [number, number])[]): string {
  return coords.map(([x, y], i) => `${i ? " " : "M"}${num(x)} ${num(y)}`).join("");
}

/** The line closed down to the baseline y, back to the first x: the filled area under it. */
export function areaPath(line: string, coords: readonly (readonly [number, number])[], baseline: number): string {
  return `${line}V${num(baseline)}H${num(coords[0][0])}Z`;
}

export const svgNum = num;
