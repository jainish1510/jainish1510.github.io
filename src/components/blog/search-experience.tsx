"use client";

import { FileText, FlaskConical, FolderGit2, Loader2, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SearchDocType, SearchResult } from "@/lib/search/engine";
import { cn } from "@/lib/utils";

const FILTERS: { key: SearchDocType | "all"; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "post", label: "Writing" },
  { key: "project", label: "Projects" },
  { key: "research", label: "Research" },
];
const ICON = { post: FileText, project: FolderGit2, research: FlaskConical, page: ArrowRight };

function highlight(text: string, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i} className="rounded bg-accent-soft px-0.5 text-fg">{part}</mark> : part));
}

export function SearchExperience({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  const [type, setType] = useState<SearchDocType | "all">("all");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);

  useEffect(() => {
    const query = q.trim();
    window.history.replaceState(null, "", query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    if (query.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}${type !== "all" ? `&type=${type}` : ""}`, { signal: controller.signal });
        setResults(((await res.json()) as { results: SearchResult[] }).results);
        setActive(0);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, type]);

  return (
    <div className="mt-10">
      <div className="relative">
        {loading ? <Loader2 className="absolute left-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-accent" /> : <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-subtle" />}
        <label htmlFor="site-search" className="sr-only">
          Search
        </label>
        <input
          ref={input}
          id="site-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (!results?.length) return;
            if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(results.length - 1, a + 1)));
            if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(0, a - 1)));
            if (e.key === "Enter") router.push(results[active]!.url);
          }}
          placeholder="Try “VAE”, “MRI” or “cloud”"
          role="combobox"
          aria-expanded={!!results?.length}
          aria-controls="search-results"
          aria-activedescendant={results?.length ? `result-${active}` : undefined}
          className="h-14 w-full rounded-2xl border border-line-strong bg-surface pl-12 pr-4 text-lg text-fg placeholder:text-subtle focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>
      <div className="mt-4 flex gap-1" role="tablist" aria-label="Filter results">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={type === f.key}
            onClick={() => setType(f.key)}
            className={cn("rounded-full px-3 py-1 text-xs transition", type === f.key ? "bg-fg text-bg" : "text-muted hover:text-fg")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8" aria-live="polite">
        {results === null ? (
          <p className="text-sm text-subtle">Type at least two characters.</p>
        ) : results.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-line-strong py-14 text-center">
            <p className="text-fg">No matching articles.</p>
            <p className="mt-1 text-sm text-muted">Try another keyword.</p>
          </div>
        ) : (
          <ul id="search-results" role="listbox" className="divide-y divide-line border-y border-line">
            {results.map((r, i) => {
              const Icon = ICON[r.type];
              return (
                <li key={r.id} id={`result-${i}`} role="option" aria-selected={i === active}>
                  <Link href={r.url} onMouseEnter={() => setActive(i)} className={cn("flex gap-4 px-2 py-5 transition-colors", i === active && "bg-surface")}>
                    <Icon className="mt-1 size-4 shrink-0 text-muted" />
                    <div className="min-w-0">
                      <p className="eyebrow">{r.type === "post" ? r.category ?? "Writing" : r.type}</p>
                      <p className="mt-1 font-medium text-fg">{highlight(r.title, q)}</p>
                      {r.snippet ? <p className="mt-1 line-clamp-2 text-sm text-muted">{highlight(r.snippet, q)}</p> : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
