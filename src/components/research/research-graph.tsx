"use client";

import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { ArrowUpRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ResearchGraphData } from "@/lib/repositories/portfolio";
import { cn } from "@/lib/utils";

type Kind = "area" | "post" | "project" | "research" | "skill";
type Node = SimulationNodeDatum & { id: string; label: string; kind: Kind; href?: string; root?: boolean; areas: string[] };
type Link_ = SimulationLinkDatum<Node> & { kind: "tree" | "member" };

const W = 960;
const H = 600;
const KIND_COLOR: Record<Kind, string> = {
  area: "var(--fg)",
  research: "var(--accent)",
  project: "var(--fg-2)",
  post: "var(--warm)",
  skill: "var(--muted)",
};
const KIND_LABEL: Record<Exclude<Kind, "area">, string> = { research: "Research", project: "Projects", post: "Writing", skill: "Technologies" };
const KIND_HREF: Record<Exclude<Kind, "area" | "skill">, string> = { research: "/research/", project: "/projects/", post: "/blog/" };

/**
 * Force-directed map of research areas (large nodes, joined by their
 * hierarchy) and everything attached to them (small satellites). The layout
 * is solved once up front — no continuous simulation burning CPU. Selecting an
 * area filters the panel to related research, projects, writing and tools,
 * including those of its sub-areas.
 */
export function ResearchGraph({ data }: { data: ResearchGraphData }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const { nodes, links, descendants } = useMemo(() => {
    const nodes: Node[] = data.areas.map((a) => ({ id: `area:${a.slug}`, label: a.name, kind: "area", root: !a.parentId, areas: [a.slug] }));
    const idBySlug = new Map(data.areas.map((a) => [a.id, a.slug]));
    const links: Link_[] = data.areas.filter((a) => a.parentId).map((a) => ({ source: `area:${idBySlug.get(a.parentId!)}`, target: `area:${a.slug}`, kind: "tree" }));
    const add = (kind: Exclude<Kind, "area">, items: { slug: string; title?: string; name?: string; areas: string[] }[]) => {
      for (const item of items) {
        if (!item.areas.length) continue;
        const id = `${kind}:${item.slug}`;
        nodes.push({ id, label: item.title ?? item.name ?? item.slug, kind, href: kind === "skill" ? undefined : `${KIND_HREF[kind]}${item.slug}`, areas: item.areas });
        for (const a of item.areas) links.push({ source: id, target: `area:${a}`, kind: "member" });
      }
    };
    add("research", data.research);
    add("project", data.projects);
    add("post", data.posts);
    add("skill", data.skills);

    const sim = forceSimulation(nodes)
      .force("link", forceLink<Node, Link_>(links).id((d) => d.id).distance((l) => (l.kind === "tree" ? 120 : 46)).strength((l) => (l.kind === "tree" ? 0.7 : 0.35)))
      .force("charge", forceManyBody<Node>().strength((d) => (d.kind === "area" ? -520 : -40)))
      .force("collide", forceCollide<Node>().radius((d) => (d.kind === "area" ? 34 : 9)))
      .force("x", forceX(W / 2).strength(0.05))
      .force("y", forceY(H / 2).strength(0.08))
      .stop();
    for (let i = 0; i < 400; i++) sim.tick();
    for (const n of nodes) {
      // Rounded so server and client markup match exactly (hydration).
      n.x = Math.round(Math.max(40, Math.min(W - 40, n.x ?? 0)));
      n.y = Math.round(Math.max(30, Math.min(H - 30, n.y ?? 0)));
    }

    // Area → itself + all descendants, for inclusive filtering.
    const children = new Map<string, string[]>();
    for (const a of data.areas) if (a.parentId) children.set(idBySlug.get(a.parentId)!, [...(children.get(idBySlug.get(a.parentId)!) ?? []), a.slug]);
    const descendants = (slug: string): string[] => [slug, ...(children.get(slug) ?? []).flatMap(descendants)];
    return { nodes, links, descendants };
  }, [data]);

  const focus = hover ?? selected;
  const focusAreas = focus ? new Set(descendants(focus)) : null;
  const isLit = (n: Node) => !focusAreas || n.areas.some((a) => focusAreas.has(a));

  const related = selected
    ? (["research", "project", "post", "skill"] as const).map((kind) => ({
        kind,
        items: nodes.filter((n) => n.kind === kind && n.areas.some((a) => focusAreas?.has(a))),
      }))
    : [];
  const selectedArea = data.areas.find((a) => a.slug === selected);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-raised">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <svg viewBox={`0 0 ${W} ${H}`} className="relative h-auto w-full" role="group" aria-label="Research areas graph">
          <g>
            {links.map((l, i) => {
              const s = l.source as Node;
              const t = l.target as Node;
              const lit = isLit(s) && isLit(t);
              return (
                <line
                  key={i}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={l.kind === "tree" ? "var(--line-strong)" : "var(--line)"}
                  strokeWidth={l.kind === "tree" ? 1.2 : 0.8}
                  strokeDasharray={l.kind === "member" ? "2 3" : undefined}
                  style={{ opacity: lit ? 1 : 0.15, transition: "opacity .3s" }}
                />
              );
            })}
          </g>
          {nodes
            .filter((n) => n.kind !== "area")
            .map((n) => (
              <g key={n.id} style={{ opacity: isLit(n) ? 1 : 0.12, transition: "opacity .3s" }}>
                <circle cx={n.x} cy={n.y} r={n.kind === "skill" ? 2.5 : 4} fill={KIND_COLOR[n.kind]}>
                  <title>{`${KIND_LABEL[n.kind as Exclude<Kind, "area">]}: ${n.label}`}</title>
                </circle>
              </g>
            ))}
          {nodes
            .filter((n) => n.kind === "area")
            .map((n, i) => {
              const slug = n.areas[0]!;
              const active = selected === slug;
              return (
                <motion.g
                  key={n.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: isLit(n) ? 1 : 0.25, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.5 }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px`, cursor: "pointer" }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  aria-label={`${n.label} — show related work`}
                  onClick={() => setSelected(active ? null : slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(active ? null : slug);
                    }
                  }}
                  onPointerEnter={() => setHover(slug)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(slug)}
                  onBlur={() => setHover(null)}
                  className="outline-none [&:focus-visible>circle:first-child]:stroke-[var(--accent)]"
                >
                  <circle cx={n.x} cy={n.y} r={n.root ? 20 : 13} fill="var(--surface)" stroke={active ? "var(--accent)" : "var(--line-strong)"} strokeWidth={active ? 2 : 1} />
                  <circle cx={n.x} cy={n.y} r={n.root ? 4 : 3} fill={active ? "var(--accent)" : "var(--fg)"} />
                  <text x={n.x} y={(n.y ?? 0) + (n.root ? 36 : 28)} textAnchor="middle" fontSize={n.root ? 13 : 11} fill={active ? "var(--fg)" : "var(--fg-2)"} fontWeight={n.root ? 500 : 400} style={{ pointerEvents: "none" }}>
                    {n.label}
                  </text>
                </motion.g>
              );
            })}
        </svg>
        <div className="absolute bottom-3 left-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-subtle">
          {(["research", "project", "post", "skill"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <i className="inline-block size-1.5 rounded-full" style={{ background: KIND_COLOR[k] }} />
              {KIND_LABEL[k]}
            </span>
          ))}
        </div>
      </div>

      <aside aria-live="polite" className="rounded-2xl border border-line bg-surface p-5">
        <AnimatePresence mode="wait">
          {selectedArea ? (
            <motion.div key={selectedArea.slug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Area</p>
                  <h3 className="mt-1 text-lg font-medium tracking-tight text-fg">{selectedArea.name}</h3>
                </div>
                <button type="button" onClick={() => setSelected(null)} aria-label="Clear selection" className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg">
                  <X className="size-4" />
                </button>
              </div>
              {selectedArea.description ? <p className="mt-2 text-sm text-muted">{selectedArea.description}</p> : null}
              <div className="mt-5 space-y-5">
                {related.map(({ kind, items }) =>
                  items.length ? (
                    <div key={kind}>
                      <p className="eyebrow mb-2 flex items-center gap-2">
                        <i className="inline-block size-1.5 rounded-full" style={{ background: KIND_COLOR[kind] }} />
                        {KIND_LABEL[kind]} · {items.length}
                      </p>
                      {kind === "skill" ? (
                        <div className="flex flex-wrap gap-1">
                          {items.map((i) => (
                            <span key={i.id} className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.625rem] text-fg-2">
                              {i.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {items.map((i) => (
                            <li key={i.id}>
                              <Link href={i.href!} className="group flex items-start justify-between gap-2 text-sm text-fg-2 hover:text-fg">
                                {i.label}
                                <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null,
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="eyebrow">Research map</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">Select an area to see the research, projects, writing and technologies connected to it — including its sub-areas.</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {data.areas
                  .filter((a) => !a.parentId)
                  .map((a) => (
                    <li key={a.slug}>
                      <button type="button" onClick={() => setSelected(a.slug)} className={cn("rounded-full border border-line px-2.5 py-1 text-xs text-fg-2 transition hover:border-line-strong hover:text-fg")}>
                        {a.name}
                      </button>
                    </li>
                  ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </div>
  );
}
