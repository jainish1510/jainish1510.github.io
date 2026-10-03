"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Entry = { id: string; role: string; organization: string; location: string | null; type: string; period: string; summary: string | null; highlights: string[]; skills: string[] };

const TYPE_LABEL: Record<string, string> = { WORK: "Work", INTERNSHIP: "Internship", RESEARCH: "Research", LEADERSHIP: "Leadership" };

/** Vertical timeline whose spine fills as you scroll; each entry expands for detail. */
export function CareerTimeline({ entries }: { entries: Entry[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [open, setOpen] = useState<string | null>(entries[0]?.id ?? null);

  return (
    <ol ref={ref} className="relative">
      <div aria-hidden className="absolute bottom-0 left-[0.6875rem] top-0 w-px bg-line md:left-[12.6875rem]" />
      <motion.div aria-hidden style={{ scaleY }} className="absolute bottom-0 left-[0.6875rem] top-0 w-px origin-top bg-accent md:left-[12.6875rem]" />
      {entries.map((e, i) => {
        const expanded = open === e.id;
        const monogram = e.organization.replace(/[^A-Z]/g, "").slice(0, 3) || e.organization.slice(0, 2).toUpperCase();
        return (
          <motion.li
            key={e.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="relative grid gap-2 pb-12 pl-10 md:grid-cols-[12rem_1fr] md:gap-10 md:pl-0"
          >
            <div className="md:pr-6 md:pt-1 md:text-right">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-fg-2">{e.period}</p>
              <p className="eyebrow mt-1">{TYPE_LABEL[e.type] ?? e.type}</p>
            </div>
            <span aria-hidden className={cn("absolute left-1.5 top-1.5 size-3 rounded-full border-2 border-bg md:left-[12.375rem]", expanded ? "bg-accent" : "bg-line-strong")} />
            <div className="md:pl-6">
              <button type="button" onClick={() => setOpen(expanded ? null : e.id)} aria-expanded={expanded} className="group flex w-full items-start gap-4 text-left">
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface font-mono text-[0.6875rem] font-medium text-fg-2">
                  {monogram}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl tracking-tight text-fg group-hover:text-accent-strong">{e.role}</span>
                  <span className="block text-sm text-muted">
                    {e.organization}
                    {e.location ? ` · ${e.location}` : ""}
                  </span>
                </span>
                <ChevronDown className={cn("mt-2 size-4 shrink-0 text-muted transition-transform", expanded && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                    <div className="pl-[3.75rem] pt-4">
                      {e.summary ? <p className="text-sm text-fg-2">{e.summary}</p> : null}
                      {e.highlights.length ? (
                        <ul className="mt-3 space-y-2">
                          {e.highlights.map((h) => (
                            <li key={h} className="flex gap-3 text-sm leading-relaxed text-muted">
                              <span className="mt-2.5 h-px w-3 shrink-0 bg-accent" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {e.skills.length ? (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {e.skills.map((s) => (
                            <span key={s} className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[0.625rem] text-fg-2">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
