"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Registry for interactive components that posts can embed with
 *   ::component[Optional title]{name="gaussian-explorer" mu="0"}
 * Each entry is code-split, so articles only pay for what they use.
 * Adding a new visualization = add a file + one line here.
 */
type SlotProps = { props: Record<string, string>; title?: string };

const loading = () => <div className="skeleton h-72 w-full" aria-label="Loading interactive figure" />;

const REGISTRY: Record<string, ComponentType<SlotProps>> = {
  "gaussian-explorer": dynamic(() => import("./interactive/gaussian-explorer"), { ssr: false, loading }),
  "sorting-visualizer": dynamic(() => import("./interactive/sorting-visualizer"), { ssr: false, loading }),
  "line-chart": dynamic(() => import("./interactive/line-chart"), { ssr: false, loading }),
  "uncertainty-sim": dynamic(() => import("./interactive/uncertainty-sim"), { ssr: false, loading }),
};

export const REGISTERED_COMPONENTS = Object.keys(REGISTRY);

export function ComponentSlot({ name, props, title }: { name: string; props?: string; title?: string }) {
  const Component = REGISTRY[name];
  let parsed: Record<string, string> = {};
  try {
    parsed = props ? (JSON.parse(props) as Record<string, string>) : {};
  } catch {
    parsed = {};
  }
  return (
    <figure className="not-prose -mx-1 overflow-hidden rounded-xl border border-line bg-bg-raised sm:-mx-6">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="eyebrow">Interactive</span>
        {title ? <span className="font-sans text-xs text-muted">{title}</span> : null}
      </div>
      <div className="p-4 font-sans sm:p-6">
        {Component ? (
          <Component props={parsed} title={title} />
        ) : (
          <p className="text-sm text-muted">
            Unknown component <code className="font-mono">{name}</code>. Available: {REGISTERED_COMPONENTS.join(", ")}.
          </p>
        )}
      </div>
    </figure>
  );
}
