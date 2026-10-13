import raw from "@/data/hourly.json";

const hourly = raw as { hours: string[]; stars: Record<string, (number | null)[]> };

/** Hourly star counts for one repo from data/hourly.json (up to the last 48 hours). */
export function getHourlyStars(fullName: string): { t: string; stars: number }[] {
  const s = hourly.stars[fullName];
  if (!s) return [];
  return hourly.hours.map((t, i) => ({ t, stars: s[i] as number })).filter((p) => typeof p.stars === "number");
}
