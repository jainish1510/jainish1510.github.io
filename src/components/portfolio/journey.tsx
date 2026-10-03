"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Event = { id: string; year: number; title: string; description: string | null; kind: string; link: string | null };

const KIND_COLOR: Record<string, string> = {
  EDUCATION: "var(--accent)",
  RESEARCH: "oklch(0.78 0.11 300)",
  WORK: "var(--fg)",
  BUILD: "var(--warm)",
  COMMUNITY: "var(--success)",
  MILESTONE: "var(--muted)",
};

/** Year-grouped timeline; each node expands in place to reveal detail. */
export function Journey({ events }: { events: Event[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const years = [...new Set(events.map((e) => e.year))];
  return (
    <ol className="relative">
      {years.map((year) => (
        <li key={year} className="grid gap-4 md:grid-cols-[8rem_1fr]">
          <p className="font-mono text-3xl font-light tabular-nums tracking-tight text-fg md:sticky md:top-24 md:self-start md:pt-3">{year}</p>
          <ul className="border-l border-line pb-10">
            {events
              .filter((e) => e.year === year)
              .map((e) => {
                const expanded = open === e.id;
                return (
                  <li key={e.id} className="relative pl-7">
                    <span aria-hidden className="absolute -left-[5px] top-[1.15rem] size-[9px] rounded-full border-2 border-bg" style={{ background: KIND_COLOR[e.kind] ?? "var(--muted)" }} />
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : e.id)}
                      aria-expanded={expanded}
                      className="group flex w-full items-center justify-between gap-4 py-3 text-left"
                    >
                      <span>
                        <span className="eyebrow mr-3">{e.kind.toLowerCase()}</span>
                        <span className="text-[0.9375rem] text-fg group-hover:text-accent-strong">{e.title}</span>
                      </span>
                      <Plus className={cn("size-4 shrink-0 text-muted transition-transform duration-300", expanded && "rotate-45")} />
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded ? (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                          <div className="pb-4 text-sm leading-relaxed text-muted">
                            {e.description}
                            {e.link ? (
                              <Link href={e.link} className="ml-2 inline-flex items-center gap-1 text-fg link-underline">
                                More <ArrowUpRight className="size-3" />
                              </Link>
                            ) : null}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </li>
                );
              })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
