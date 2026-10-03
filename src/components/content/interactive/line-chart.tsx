"use client";

import { useState } from "react";

/**
 * Minimal data-driven chart for posts:
 *   ::component{name="line-chart" series="0.9,0.7,0.52,0.41" labels="1,2,3,4" y="loss"}
 * Multiple series: series="1,2,3|3,2,1" legend="train|val"
 */
const W = 560;
const H = 220;
const PAD = 32;
const COLORS = ["var(--accent)", "var(--warm)", "var(--muted)"];

export default function LineChart({ props }: { props: Record<string, string> }) {
  const series = (props.series ?? "").split("|").map((s) => s.split(",").map(Number).filter(Number.isFinite)).filter((s) => s.length > 1);
  const legend = (props.legend ?? "").split("|");
  const labels = (props.labels ?? "").split(",");
  const [hover, setHover] = useState<number | null>(null);
  if (!series.length) return <p className="text-sm text-muted">No data.</p>;

  const all = series.flat();
  const min = Math.min(...all);
  const max = Math.max(...all);
  const len = Math.max(...series.map((s) => s.length));
  const x = (i: number) => PAD + (i / (len - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / (max - min || 1)) * (H - PAD * 2);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={props.y ? `Line chart of ${props.y}` : "Line chart"}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          setHover(Math.max(0, Math.min(len - 1, Math.round(((px - PAD) / (W - PAD * 2)) * (len - 1)))));
        }}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={PAD} x2={W - PAD} y1={y(min + t * (max - min))} y2={y(min + t * (max - min))} stroke="var(--line)" />
            <text x={4} y={y(min + t * (max - min)) + 3} fontSize={9} fill="var(--muted)" fontFamily="var(--font-mono)">
              {(min + t * (max - min)).toFixed(2)}
            </text>
          </g>
        ))}
        {series.map((s, si) => (
          <path key={si} d={s.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join("")} fill="none" stroke={COLORS[si % 3]} strokeWidth={1.75} />
        ))}
        {hover !== null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD} y2={H - PAD} stroke="var(--line-strong)" />
            {series.map((s, si) =>
              s[hover] !== undefined ? <circle key={si} cx={x(hover)} cy={y(s[hover]!)} r={3.5} fill={COLORS[si % 3]} /> : null,
            )}
          </g>
        ) : null}
        {labels.length === len
          ? labels.map((l, i) =>
              i % Math.ceil(len / 8) === 0 ? (
                <text key={i} x={x(i)} y={H - 10} fontSize={9} textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)">
                  {l}
                </text>
              ) : null,
            )
          : null}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 font-mono text-xs text-muted">
        {series.map((s, si) => (
          <span key={si} className="flex items-center gap-1.5">
            <i className="inline-block h-0.5 w-4" style={{ background: COLORS[si % 3] }} />
            {legend[si] || `series ${si + 1}`}
            {hover !== null && s[hover] !== undefined ? <b className="font-normal text-fg">{s[hover]}</b> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
