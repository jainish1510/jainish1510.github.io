"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export function RandomFact({ facts }: { facts: string[] }) {
  const [index, setIndex] = useState(0);
  if (!facts.length) return null;
  const next = () => {
    if (facts.length < 2) return;
    let n = index;
    while (n === index) n = Math.floor(Math.random() * facts.length);
    setIndex(n);
  };
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5">
      <p className="eyebrow">A random fact</p>
      <div className="relative mt-4 min-h-24 flex-1">
        <AnimatePresence mode="wait">
          <motion.p key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="font-serif text-xl leading-snug text-fg" aria-live="polite">
            {facts[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <button type="button" onClick={next} className="group mt-4 flex w-fit items-center gap-1.5 text-sm text-muted hover:text-fg">
        Another fact <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
