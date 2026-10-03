import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, tone = "neutral", ...props }: ComponentProps<"span"> & { tone?: "neutral" | "accent" | "warm" | "success" | "danger" | "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[0.6875rem] leading-4 tracking-wide",
        tone === "neutral" && "bg-surface-2 text-fg-2",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "warm" && "bg-warm-soft text-warm",
        tone === "success" && "bg-success/12 text-success",
        tone === "danger" && "bg-danger/12 text-danger",
        tone === "outline" && "border border-line text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface-2 px-1 font-mono text-[0.625rem] text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden className={cn("skeleton", className)} {...props} />;
}

export function Separator({ className, ...props }: ComponentProps<"hr">) {
  return <hr className={cn("border-0 border-t border-line", className)} {...props} />;
}

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("eyebrow", className)} {...props} />;
}

/** Section header used across public pages: index number + label + title. */
export function SectionHeading({
  index,
  label,
  title,
  description,
  action,
  className,
}: {
  index?: string;
  label: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl space-y-4">
        <p className="eyebrow flex items-center gap-3">
          {index ? <span className="text-subtle">{index}</span> : null}
          <span className="h-px w-6 bg-line-strong" />
          {label}
        </p>
        <h2 className="text-balance text-3xl font-medium tracking-[-0.03em] text-fg md:text-[2.5rem] md:leading-[1.1]">{title}</h2>
        {description ? <p className="max-w-xl text-pretty text-[0.9375rem] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center", className)}>
      <div className="mb-5 grid size-10 place-items-center rounded-full border border-line">
        <span className="size-1.5 animate-[pulse-dot_2.4s_ease-in-out_infinite] rounded-full bg-muted" />
      </div>
      <p className="text-lg font-medium tracking-tight text-fg">{title}</p>
      {description ? <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function LiveDot({ className, tone = "success" }: { className?: string; tone?: "success" | "warm" | "accent" | "muted" }) {
  const color = { success: "bg-success", warm: "bg-warm", accent: "bg-accent", muted: "bg-muted" }[tone];
  return (
    <span className={cn("relative inline-flex size-1.5", className)}>
      <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", color)} />
      <span className={cn("relative inline-flex size-1.5 rounded-full", color)} />
    </span>
  );
}
