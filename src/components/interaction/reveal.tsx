"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

/** Fade-and-rise on first entering the viewport. Disabled for reduced motion. */
export function Reveal({ delay = 0, y = 18, children, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
