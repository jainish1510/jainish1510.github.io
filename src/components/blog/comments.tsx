"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/interaction/theme";

type Config = { repo: string; repoId: string; category: string; categoryId: string };

/**
 * Optional comments powered by giscus (GitHub Discussions). Readers sign in
 * with GitHub; comments live in your repository, so there is no server or
 * database to run. Off unless `comments.enabled: true` in content/site.yml.
 */
export function Comments({ config }: { config: Config }) {
  const host = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    const attrs: Record<string, string> = {
      "data-repo": config.repo,
      "data-repo-id": config.repoId,
      "data-category": config.category,
      "data-category-id": config.categoryId,
      "data-mapping": "pathname",
      "data-strict": "0",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "top",
      "data-theme": theme === "light" ? "light" : "dark_dimmed",
      "data-lang": "en",
      "data-loading": "lazy",
    };
    for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
    el.appendChild(script);
  }, [config, theme]);

  return (
    <section id="comments" aria-labelledby="comments-heading" className="scroll-mt-24">
      <div className="flex items-baseline justify-between border-b border-line pb-4">
        <h2 id="comments-heading" className="eyebrow !text-fg">
          Discussion
        </h2>
        <span className="text-xs text-subtle">Sign in with GitHub to comment</span>
      </div>
      <div ref={host} className="mt-8 min-h-24" />
    </section>
  );
}
