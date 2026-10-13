import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared OG card layout used by all opengraph-image routes. */
/** Drop symbols the bundled OG font lacks (they'd trigger a remote font fetch at build time). */
const clean = (s: string) => s.replace(/[\u2300-\u23FF\u2600-\u27BF\uFF5C\p{Extended_Pictographic}]/gu, "").trim();

export function ogCard(input: { eyebrow: string; title: string; subtitle?: string; stat?: string }) {
  const eyebrow = clean(input.eyebrow);
  const title = clean(input.title);
  const subtitle = input.subtitle && clean(input.subtitle);
  const stat = input.stat && clean(input.stat);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, color: "#a5b4fc" }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: "#4f46e5", display: "flex" }} />
          OSS Radar · {eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: title.length > 40 ? 56 : 72, fontWeight: 700, lineHeight: 1.1, display: "flex" }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 30, color: "#d4d4d8", lineHeight: 1.35, display: "flex" }}>
              {subtitle.length > 160 ? `${subtitle.slice(0, 157)}…` : subtitle}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#a1a1aa" }}>
          <span>ossradar.net</span>
          {stat && <span style={{ color: "#34d399", fontWeight: 700 }}>{stat}</span>}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
