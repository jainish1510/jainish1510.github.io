"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/content/markdown";
import { cn } from "@/lib/utils";

/** Highlights the heading currently being read. */
export function TableOfContents({ toc, className }: { toc: TocEntry[]; className?: string }) {
  const [active, setActive] = useState<string | null>(toc[0]?.id ?? null);

  useEffect(() => {
    const headings = toc.map((t) => document.getElementById(t.id)).filter((h): h is HTMLElement => !!h);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [toc]);

  if (!toc.length) return null;
  return (
    <nav aria-label="Table of contents" className={className}>
      <p className="eyebrow mb-4">Contents</p>
      <ol className="space-y-0.5 border-l border-line">
        {toc.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              aria-current={active === t.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1.5 text-[0.8125rem] leading-snug transition-colors",
                t.depth === 3 ? "pl-7" : "pl-4",
                active === t.id ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg-2",
              )}
            >
              {t.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
