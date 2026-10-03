"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { EmptyState } from "@/components/ui/primitives";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import type { ProjectCard as ProjectCardData } from "@/lib/store/types";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./project-card";

export function ProjectExplorer({ projects }: { projects: ProjectCardData[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const active = (params.get("category") ?? "ALL").toUpperCase();
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: projects.length };
    for (const p of projects) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [projects]);
  const visible = active === "ALL" ? projects : projects.filter((p) => p.category === active);

  const select = (cat: string) => router.replace(cat === "ALL" ? "/projects/" : `/projects/?category=${cat.toLowerCase()}`, { scroll: false });

  return (
    <>
      <div role="tablist" aria-label="Filter projects by category" className="-mx-1 flex gap-1 overflow-x-auto border-y border-line py-3">
        {["ALL", ...PROJECT_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={active === cat}
            disabled={cat !== "ALL" && !counts[cat]}
            onClick={() => select(cat)}
            className={cn(
              "relative shrink-0 rounded-full px-3.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition disabled:opacity-30",
              active === cat ? "text-bg" : "text-muted hover:text-fg",
            )}
          >
            {active === cat ? <motion.span layoutId="project-filter" className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", stiffness: 400, damping: 34 }} /> : null}
            <span className="relative">
              {cat} <span className="opacity-50">{counts[cat] ?? 0}</span>
            </span>
          </button>
        ))}
      </div>
      <motion.div layout className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              <ProjectCard project={p} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {!visible.length ? <EmptyState className="mt-10" title="No projects here yet." description="Try another category." /> : null}
    </>
  );
}
