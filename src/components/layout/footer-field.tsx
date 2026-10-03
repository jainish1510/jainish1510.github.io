"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-media";

/**
 * A quiet dot field that ripples outward from the cursor. 2D canvas, only
 * animates while visible, and renders a single static frame for reduced motion.
 */
export function FooterField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let visible = false;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    const GAP = 22;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const color = () => getComputedStyle(document.documentElement).getPropertyValue("--scene-point").trim() || "236 236 238";

    let rgb = color();
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (let x = GAP / 2; x < w; x += GAP) {
        for (let y = GAP / 2; y < h; y += GAP) {
          const d = Math.hypot(x - mouse.x, y - mouse.y);
          const wave = Math.sin(x * 0.012 + y * 0.018 + t * 0.0006) * 0.5 + 0.5;
          const near = Math.max(0, 1 - d / 180);
          const fade = Math.min(1, (h - y) / h + 0.15);
          const a = (0.05 + wave * 0.07 + near * 0.45) * fade;
          ctx.fillStyle = `rgb(${rgb} / ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, 0.8 + near * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    const loop = (t: number) => {
      draw(t);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };

    resize();
    draw(0);
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onTheme = () => {
      rgb = color();
      draw(performance.now());
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("studio:theme", onTheme);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("studio:theme", onTheme);
    };
  }, [reduced]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 size-full" />;
}
