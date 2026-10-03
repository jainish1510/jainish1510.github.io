"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Link from "next/link";
import type { PointerEvent } from "react";
import { Badge } from "@/components/ui/primitives";
import type { ProjectCard as ProjectCardData } from "@/lib/store/types";
import { cn } from "@/lib/utils";
import { Cover } from "./cover";

const STATUS_TONE = { ACTIVE: "accent", COMPLETED: "neutral", PROTOTYPE: "warm", ARCHIVED: "outline" } as const;

/**
 * Hover = depth: the card tilts toward the pointer, the cover shifts the other
 * way (parallax), a soft light follows the cursor, and tags cascade in.
 */
export function ProjectCard({ project, index = 0, large = false }: { project: ProjectCardData; index?: number; large?: boolean }) {
  const reduce = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const light = useMotionTemplate`radial-gradient(420px circle at ${mx}% ${my}%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 60%)`;
  const imgX = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 });
  const imgY = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 });

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rx.set((0.5 - py) * 6);
    ry.set((px - 0.5) * 8);
    imgX.set((0.5 - px) * 14);
    imgY.set((0.5 - py) * 10);
    mx.set(px * 100);
    my.set(py * 100);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    imgX.set(0);
    imgY.set(0);
  };

  return (
    <motion.article
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group/card relative h-full"
    >
      <Link
        href={`/projects/${project.slug}`}
        data-cursor="project"
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-300 hover:border-line-strong"
      >
        <div className={cn("relative overflow-hidden border-b border-line", large ? "aspect-[16/9]" : "aspect-[16/10]")}>
          <motion.div style={{ x: imgX, y: imgY, scale: 1.06 }} className="absolute inset-0">
            <Cover
              media={project.cover}
              seed={project.slug}
              sizes={large ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
              className="size-full"
              imgClassName="transition duration-700 group-hover/card:brightness-110"
            />
          </motion.div>
          <div className="absolute left-4 top-4 flex gap-1.5">
            <Badge className="bg-bg/70 backdrop-blur">{project.category}</Badge>
            {project.isPlaceholder ? <Badge tone="warm" className="backdrop-blur">Details pending</Badge> : null}
          </div>
          <span className="absolute right-4 top-4 grid size-8 place-items-center rounded-full border border-white/15 bg-black/40 text-white opacity-0 backdrop-blur transition duration-300 group-hover/card:opacity-100">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" style={{ background: light }} />
          <div className="relative flex items-center justify-between gap-3">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">
              {String(index + 1).padStart(2, "0")} · {project.startDate ? new Date(project.startDate).getUTCFullYear() : "Ongoing"}
            </p>
            <Badge tone={STATUS_TONE[project.status as keyof typeof STATUS_TONE] ?? "neutral"}>{project.status.toLowerCase()}</Badge>
          </div>
          <h3 className={cn("relative mt-3 font-medium tracking-[-0.02em] text-fg", large ? "text-2xl" : "text-lg")}>{project.title}</h3>
          <p className="relative mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{project.summary}</p>
          {project.recognition ? <p className="relative mt-3 text-xs text-warm">◆ {project.recognition}</p> : null}
          <ul className="relative mt-auto flex flex-wrap gap-1.5 pt-5">
            {project.skills.slice(0, 5).map((s, i) => (
              <li
                key={s.slug}
                className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[0.625rem] text-muted transition-[transform,color,border-color] duration-300 group-hover/card:-translate-y-0.5 group-hover/card:border-line-strong group-hover/card:text-fg-2"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      </Link>
    </motion.article>
  );
}
