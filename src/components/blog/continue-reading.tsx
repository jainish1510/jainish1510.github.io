"use client";

import { ArrowDown, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/** Offers to jump back to where the reader stopped last time (from localStorage). */
export function ContinueReading({ postId }: { postId: string }) {
  const [saved, setSaved] = useState<{ pct: number; y: number } | null>(null);

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem("studio-progress") ?? "{}") as Record<string, { pct: number; y: number; at: number }>;
      const entry = all[postId];
      if (entry && entry.pct > 8 && entry.pct < 95 && window.scrollY < 200) setSaved(entry);
    } catch {
      /* ignore */
    }
  }, [postId]);

  return (
    <AnimatePresence>
      {saved ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line-strong bg-surface/95 p-1 pl-4 text-sm shadow-2xl backdrop-blur"
          role="status"
        >
          <span className="text-muted">Reading progress: {saved.pct}%</span>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: saved.y, behavior: "smooth" });
              setSaved(null);
            }}
            className="ml-2 flex items-center gap-1.5 rounded-full bg-fg px-3 py-1.5 text-xs font-medium text-bg"
          >
            Continue reading <ArrowDown className="size-3.5" />
          </button>
          <button type="button" onClick={() => setSaved(null)} aria-label="Dismiss" className="rounded-full p-1.5 text-muted hover:text-fg">
            <X className="size-3.5" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
