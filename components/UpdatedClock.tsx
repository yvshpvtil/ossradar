"use client";

import { useEffect, useState } from "react";

/** The collector runs at :17 every hour (UTC); the redeploy is usually live ~5 minutes later. */
function nextUpdate(now: number): number {
  const d = new Date(now);
  d.setUTCMinutes(22, 0, 0);
  if (d.getTime() <= now) d.setUTCHours(d.getUTCHours() + 1);
  return d.getTime();
}

const fmt = (iso: string, tz: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: tz, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

export function UpdatedClock({ generatedAt }: { generatedAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const mins = now == null ? null : Math.max(1, Math.round((nextUpdate(now) - now) / 60_000));
  return (
    <span>
      Last updated {fmt(generatedAt, "Asia/Kolkata")} IST ({fmt(generatedAt, "UTC")} UTC) · updates hourly
      {mins != null && <> · next in ~{mins} min</>}
    </span>
  );
}
