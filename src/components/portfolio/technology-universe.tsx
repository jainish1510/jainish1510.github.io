"use client";

import { forceCollide, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS, type SkillCategory } from "@/lib/constants";
import { cn, hashString } from "@/lib/utils";

type Skill = { id: string; name: string; category: string; usedFor: string | null; proficiency: number; projects: { title: string; slug: string }[]; research: { title: string; slug: string }[]; experiences: number };
type Node = SimulationNodeDatum & Skill & { r: number; cx: number; cy: number };

const W = 960;
const H = 620;

/**
 * Technologies clustered by category around anchor points on an ellipse.
 * Bubble size encodes how much real work uses the tool (projects + research
 * + roles). Layout is solved once with d3-force; interaction is pure SVG.
 */
export function TechnologyUniverse({ skills }: { skills: Skill[] }) {
  const [hover, setHover] = useState<Node | null>(null);
  const [category, setCategory] = useState<SkillCategory | null>(null);

  const { nodes, anchors } = useMemo(() => {
    const cats = SKILL_CATEGORIES.filter((c) => skills.some((s) => s.category === c));
    const anchors = Object.fromEntries(
      cats.map((c, i) => {
        const a = (i / cats.length) * Math.PI * 2 - Math.PI / 2;
        return [c, { x: W / 2 + Math.cos(a) * 320, y: H / 2 + Math.sin(a) * 210 }];
      }),
    ) as Record<string, { x: number; y: number }>;
    const nodes: Node[] = skills.map((s) => {
      const usage = s.projects.length + s.research.length + s.experiences;
      const anchor = anchors[s.category]!;
      return { ...s, r: 9 + Math.sqrt(usage) * 7 + s.proficiency, cx: anchor.x, cy: anchor.y, x: anchor.x + ((hashString(s.name) % 100) / 100 - 0.5) * 20, y: anchor.y + ((hashString(s.id) % 100) / 100 - 0.5) * 20 };
    });
    const sim = forceSimulation(nodes)
      .force("x", forceX<Node>((d) => d.cx).strength(0.18))
      .force("y", forceY<Node>((d) => d.cy).strength(0.18))
      .force("collide", forceCollide<Node>((d) => d.r + 3))
      .stop();
    for (let i = 0; i < 300; i++) sim.tick();
    for (const n of nodes) {
      n.x = Math.round(n.x ?? 0);
      n.y = Math.round(n.y ?? 0);
    }
    return { nodes, anchors };
  }, [skills]);

  const dim = (n: Node) => (category && n.category !== category) || (hover && hover.id !== n.id);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
        {Object.keys(anchors).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(category === c ? null : (c as SkillCategory))}
            className={cn("rounded-full border px-3 py-1 text-xs transition", category === c ? "border-accent/60 bg-accent-soft text-accent" : "border-line text-muted hover:text-fg")}
          >
            {SKILL_CATEGORY_LABELS[c as SkillCategory]}
          </button>
        ))}
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-raised">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Technology map grouped by category">
          <ellipse cx={W / 2} cy={H / 2} rx={320} ry={210} fill="none" stroke="var(--line)" strokeDasharray="2 6" />
          {Object.entries(anchors).map(([c, p]) => (
            <text key={c} x={p.x} y={p.y < H / 2 ? p.y - 70 : p.y + 82} textAnchor="middle" fontSize={10} letterSpacing={1.6} fill="var(--subtle)" fontFamily="var(--font-mono)">
              {SKILL_CATEGORY_LABELS[c as SkillCategory].toUpperCase()}
            </text>
          ))}
          {nodes.map((n) => (
            <g
              key={n.id}
              tabIndex={0}
              role="button"
              aria-label={`${n.name}: ${n.projects.length} projects`}
              onPointerEnter={() => setHover(n)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              style={{ opacity: dim(n) ? 0.2 : 1, transition: "opacity .25s", cursor: "default" }}
              className="outline-none"
            >
              <circle cx={n.x} cy={n.y} r={n.r} fill="var(--surface)" stroke={hover?.id === n.id ? "var(--accent)" : "var(--line-strong)"} />
              <circle cx={n.x} cy={n.y} r={n.r} fill="var(--accent)" fillOpacity={0.04 + n.proficiency * 0.025} />
              {n.r > 16 ? (
                <text x={n.x} y={(n.y ?? 0) + 3} textAnchor="middle" fontSize={n.r > 24 ? 11 : 9} fill="var(--fg-2)" style={{ pointerEvents: "none" }}>
                  {n.name.length > 12 ? `${n.name.slice(0, 10)}…` : n.name}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
        <AnimatePresence>
          {hover ? (
            <motion.div
              key={hover.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute w-60 rounded-xl border border-line-strong bg-surface/95 p-4 shadow-2xl backdrop-blur"
              style={{ left: `min(calc(${((hover.x ?? 0) / W) * 100}% + 16px), calc(100% - 15.5rem))`, top: `${((hover.y ?? 0) / H) * 100}%` }}
            >
              <p className="eyebrow">{SKILL_CATEGORY_LABELS[hover.category as SkillCategory]}</p>
              <p className="mt-1 text-base font-medium text-fg">{hover.name}</p>
              {hover.usedFor ? (
                <>
                  <p className="eyebrow mt-3">Used for</p>
                  <ul className="mt-1 text-xs text-fg-2">
                    {hover.usedFor.split("\n").map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <p className="eyebrow mt-3">Projects</p>
              <p className="font-mono text-lg text-fg">{hover.projects.length}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      {/* Accessible / mobile list view of the same data */}
      <details className="mt-4 rounded-xl border border-line px-5 py-3">
        <summary className="cursor-pointer text-sm text-muted">View as list</summary>
        <div className="mt-4 grid gap-6 pb-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.keys(anchors).map((c) => (
            <div key={c}>
              <p className="eyebrow mb-2">{SKILL_CATEGORY_LABELS[c as SkillCategory]}</p>
              <ul className="space-y-1 text-sm text-fg-2">
                {skills
                  .filter((s) => s.category === c)
                  .map((s) => (
                    <li key={s.id}>
                      {s.name}
                      {s.projects.length ? (
                        <span className="text-xs text-subtle">
                          {" "}
                          · {s.projects.map((p, i) => (
                            <Link key={p.slug} href={`/projects/${p.slug}`} className="hover:text-fg">
                              {i ? ", " : ""}
                              {p.title}
                            </Link>
                          ))}
                        </span>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
