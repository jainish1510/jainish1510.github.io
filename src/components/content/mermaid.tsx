"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Mermaid is ~1MB, so it is only imported when a diagram scrolls near the
 * viewport. `securityLevel: "strict"` makes mermaid sanitise its own output.
 */
export function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        try {
          const mermaid = (await import("mermaid")).default;
          const light = document.documentElement.dataset.theme === "light";
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base",
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            themeVariables: light
              ? { primaryColor: "#ffffff", primaryBorderColor: "#c9cbd0", lineColor: "#8a8d94", primaryTextColor: "#111214", fontSize: "14px" }
              : {
                  primaryColor: "#16171a",
                  primaryBorderColor: "#34363c",
                  lineColor: "#5c6068",
                  primaryTextColor: "#ececee",
                  secondaryColor: "#101113",
                  tertiaryColor: "#0c0d0f",
                  fontSize: "14px",
                },
          });
          const result = await mermaid.render(`mmd-${id}`, code.trim());
          if (!cancelled) setSvg(result.svg);
        } catch {
          if (!cancelled) setError(true);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [code, id]);

  return (
    <figure ref={ref} className="not-prose -mx-1 rounded-xl border border-line bg-bg-raised p-5 sm:-mx-6">
      {svg ? (
        <div className="mermaid-host flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : error ? (
        <pre className="overflow-x-auto font-mono text-xs text-muted">{code}</pre>
      ) : (
        <div className="skeleton h-40 w-full" aria-label="Loading diagram" />
      )}
      <figcaption className="eyebrow mt-3 text-center">Diagram</figcaption>
    </figure>
  );
}
