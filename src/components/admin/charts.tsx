"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compactNumber } from "@/lib/utils";

type Point = { date: string; value: number };

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs shadow-xl">
      <p className="text-muted">{label ? fmtDay(label) : ""}</p>
      <p className="mt-0.5 font-mono text-sm text-fg">
        {payload[0]!.value.toLocaleString()} <span className="text-muted">{unit}</span>
      </p>
    </div>
  );
}

/**
 * Single-series time chart: one hue, one axis, 2px line, recessive grid,
 * crosshair tooltip. The title above names the series, so no legend box.
 */
export function TimeSeries({ data, unit, height = 220, id }: { data: Point[]; unit: string; height?: number; id: string }) {
  return (
    <div style={{ height }} role="img" aria-label={`${unit} per day, ${data.length} days`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fill: "var(--subtle)", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={32} />
          <YAxis allowDecimals={false} tickFormatter={(v: number) => compactNumber(v)} tick={{ fill: "var(--subtle)", fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill={`url(#fill-${id})`} activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--accent)" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ranked horizontal bars as plain HTML: labels in text ink, value right-aligned, hover reveals share. */
export function RankBars({ items, unit }: { items: { name: string; value: number }[]; unit: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  if (!items.length) return <p className="py-6 text-center text-sm text-subtle">No data for this period.</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.name} className="group" title={`${i.name}: ${i.value.toLocaleString()} ${unit} (${Math.round((i.value / total) * 100)}%)`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-fg-2 group-hover:text-fg">{i.name}</span>
            <span className="font-mono text-xs tabular-nums text-muted">
              <span className="mr-2 opacity-0 transition group-hover:opacity-100">{Math.round((i.value / total) * 100)}%</span>
              {i.value.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent/80 transition-[width] duration-700 group-hover:bg-accent" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
