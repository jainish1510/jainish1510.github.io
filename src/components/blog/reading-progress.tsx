"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useEffect, type RefObject } from "react";

/** Thin bar pinned under the header, tracking progress through the article body. */
export function ReadingProgress({ target, postId }: { target: RefObject<HTMLElement | null>; postId: string }) {
  const { scrollYProgress } = useScroll({ target, offset: ["start 80px", "end end"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  // Persist progress so a returning reader can continue where they left off.
  useEffect(() => {
    let last = 0;
    return scrollYProgress.on("change", (v) => {
      const pct = Math.round(v * 100);
      if (Math.abs(pct - last) < 3) return;
      last = pct;
      try {
        const all = JSON.parse(localStorage.getItem("studio-progress") ?? "{}") as Record<string, { pct: number; y: number; at: number }>;
        all[postId] = { pct, y: Math.round(window.scrollY), at: Date.now() };
        localStorage.setItem("studio-progress", JSON.stringify(all));
      } catch {
        /* ignore */
      }
    });
  }, [scrollYProgress, postId]);

  return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-16 z-40 h-px origin-left bg-accent" />;
}
