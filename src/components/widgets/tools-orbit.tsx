"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-media";

type Tool = { name: string; usedFor: string | null; projects: number };

/**
 * Favourite tools orbiting a core on two tilted rings. Positions are a 3D
 * circle projected to an ellipse; depth drives scale, opacity and stacking,
 * so labels stay upright and readable. One rAF loop moves a dozen nodes;
 * hovering pauses the orbit so the label can be read.
 */
export function ToolsOrbit({ tools }: { tools: Tool[] }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState<Tool | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const paused = useRef(false);

  useEffect(() => {
    paused.current = !!active;
  }, [active]);

  useEffect(() => {
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const place = () => {
      tools.forEach((_, i) => {
        const el = refs.current[i];
        if (!el) return;
        const ring = i % 2;
        const count = Math.ceil(tools.length / 2);
        const radius = ring === 0 ? 30 : 44;
        const speed = ring === 0 ? 0.12 : -0.08;
        const a = (Math.floor(i / 2) / count) * Math.PI * 2 + t * speed + ring * 0.6;
        const depth = Math.sin(a); // -1 back … 1 front
        const x = 50 + Math.cos(a) * radius;
        const y = 50 + depth * radius * 0.36;
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        el.style.transform = `translate(-50%, -50%) scale(${0.82 + (depth + 1) * 0.12})`;
        el.style.opacity = String(0.45 + (depth + 1) * 0.275);
        el.style.zIndex = String(Math.round((depth + 1) * 10));
      });
    };
    const loop = (now: number) => {
      if (!paused.current) t += (now - last) / 1000;
      last = now;
      place();
      raf = requestAnimationFrame(loop);
    };
    place();
    if (!reduced) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tools, reduced]);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="eyebrow">Favorite tools</p>
      <div className="relative mx-auto mt-2 aspect-[4/3] max-w-[24rem]">
        <div aria-hidden className="absolute inset-x-[20%] top-[39%] h-[22%] rounded-[50%] border border-line" />
        <div aria-hidden className="absolute inset-x-[6%] top-[34%] h-[32%] rounded-[50%] border border-line" />
        <div aria-hidden className="absolute left-1/2 top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_36px_var(--accent)]" />
        {tools.map((t, i) => (
          <button
            key={t.name}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            onMouseEnter={() => setActive(t)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(t)}
            onBlur={() => setActive(null)}
            className="absolute whitespace-nowrap rounded-full border border-line-strong bg-bg px-2 py-0.5 font-mono text-[0.625rem] text-fg-2 transition-colors hover:border-accent hover:text-fg"
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="min-h-10 text-center" aria-live="polite">
        {active ? (
          <>
            <p className="text-sm font-medium text-fg">{active.name}</p>
            <p className="text-xs text-muted">
              {active.usedFor?.split("\n").join(" · ")}
              {active.projects ? ` · ${active.projects} project${active.projects > 1 ? "s" : ""}` : ""}
            </p>
          </>
        ) : (
          <p className="text-xs text-subtle">Hover a tool to see what it&apos;s for</p>
        )}
      </div>
    </div>
  );
}
