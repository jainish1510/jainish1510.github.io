import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared OpenGraph card: dark graphite, constellation dots, title in large type. */
export function ogCard({ eyebrow, title, subtitle, footer }: { eyebrow: string; title: string; subtitle?: string | null; footer: string }) {
  const dots = Array.from({ length: 60 }, (_, i) => ({ x: (i * 197) % 1200, y: (i * 89) % 630, r: 1 + (i % 3) }));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#08090a", color: "#ececee", fontFamily: "sans-serif", position: "relative" }}>
        {dots.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: d.x, top: d.y, width: d.r * 2, height: d.r * 2, borderRadius: 99, background: i % 7 === 0 ? "#7dd3d8" : "#3a3c42" }} />
        ))}
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#7dd3d8" }}>{eyebrow}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: title.length > 60 ? 56 : 68, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, maxWidth: 1000 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 30, color: "#a0a3aa", maxWidth: 950 }}>{subtitle}</div> : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#84878f", borderTop: "1px solid #24262b", paddingTop: 24 }}>
          <span>{footer}</span>
          <span>Research · Building · Writing</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
