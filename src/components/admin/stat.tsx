import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Stat({ label, value, hint, trend, className }: { label: string; value: ReactNode; hint?: ReactNode; trend?: number | null; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-4", className)}>
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-mono text-2xl tabular-nums tracking-tight text-fg">{value}</p>
      {trend !== undefined && trend !== null ? (
        <p className={cn("mt-1 text-xs", trend >= 0 ? "text-success" : "text-danger")}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(Math.round(trend * 100))}% vs previous period
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-fg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
