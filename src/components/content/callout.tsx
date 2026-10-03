import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const STYLES: Record<string, { label: string; className: string }> = {
  note: { label: "Note", className: "border-accent/40 bg-accent-soft" },
  tip: { label: "Tip", className: "border-success/40 bg-success/10" },
  warning: { label: "Caution", className: "border-warm/50 bg-warm-soft" },
  demo: { label: "Demonstration content", className: "border-line-strong bg-surface-2" },
};

export function Callout({ kind = "note", title, children }: { kind?: string; title?: string; children?: ReactNode }) {
  const style = STYLES[kind] ?? STYLES.note!;
  return (
    <aside
      role="note"
      className={cn("rounded-xl border px-5 py-4 font-sans text-[0.95rem] leading-relaxed text-fg-2 [&>*+*]:mt-3", style.className)}
    >
      <p className="eyebrow !text-fg">{title ?? style.label}</p>
      {children}
    </aside>
  );
}
