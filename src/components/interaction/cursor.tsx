"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFinePointer, useReducedMotion } from "@/hooks/use-media";

type Mode = "default" | "link" | "project" | "read" | "external" | "zoom" | "text";

/**
 * A small dot + ring that eases toward the pointer. Elements opt into
 * richer states with `data-cursor="project|read|external|zoom"`. Disabled on
 * touch devices and for reduced motion; the native cursor is restored there.
 */
export function CustomCursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("default");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      delete document.documentElement.dataset.cursor;
      return;
    }
    document.documentElement.dataset.cursor = "on";
    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let raf = 0;

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      if (ring.current) ring.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (dot.current) dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      raf = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.1 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      setVisible(true);
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onOver = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      const tagged = el.closest<HTMLElement>("[data-cursor]");
      if (tagged) return setMode((tagged.dataset.cursor as Mode) ?? "link");
      if (el.closest("input, textarea, [contenteditable=true]")) return setMode("text");
      if (el.closest("a, button, [role=button], label, select, summary")) return setMode("link");
      setMode("default");
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      delete document.documentElement.dataset.cursor;
    };
  }, [enabled]);

  if (!enabled) return null;

  const label = mode === "project" ? "View" : mode === "read" ? "Read" : null;
  const size = mode === "project" || mode === "read" ? 64 : mode === "external" || mode === "zoom" ? 40 : mode === "link" ? 36 : mode === "text" ? 4 : 24;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[120]" style={{ opacity: visible ? 1 : 0, transition: "opacity .2s" }}>
      <div ref={ring} className="absolute left-0 top-0 will-change-transform">
        <div
          className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[0.625rem] font-medium uppercase tracking-[0.12em] transition-[width,height,background,border-color] duration-300 ease-[var(--ease-out-expo)]"
          style={{
            width: size,
            height: mode === "text" ? 22 : size,
            borderRadius: mode === "text" ? 2 : 999,
            scale: pressed ? 0.85 : 1,
            borderColor: mode === "default" ? "color-mix(in oklab, var(--fg) 30%, transparent)" : "var(--accent)",
            background: label ? "var(--accent)" : mode === "external" || mode === "zoom" ? "color-mix(in oklab, var(--accent) 18%, transparent)" : "transparent",
            color: label ? "#05282a" : "var(--accent)",
          }}
        >
          {label}
          {mode === "external" ? <ArrowUpRight className="size-4" /> : null}
          {mode === "zoom" ? <Plus className="size-4" /> : null}
        </div>
      </div>
      <div ref={dot} className="absolute left-0 top-0">
        <div className="size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg" style={{ opacity: label || mode === "text" ? 0 : 1 }} />
      </div>
    </div>
  );
}
