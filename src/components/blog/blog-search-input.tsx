"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Kbd } from "@/components/ui/primitives";

/** Filters the article list in place; updates the URL so results are shareable. */
export function BlogSearchInput({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      if (value === (params.get("q") ?? "")) return;
      const sp = new URLSearchParams(params.toString());
      if (value.trim()) sp.set("q", value.trim());
      else sp.delete("q");
      start(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    }, 250);
    return () => clearTimeout(t);
  }, [value, params, pathname, router]);

  return (
    <div className="relative w-full md:w-72">
      <Search className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 ${pending ? "animate-pulse text-accent" : "text-subtle"}`} />
      <label htmlFor="blog-search" className="sr-only">
        Search articles
      </label>
      <input
        id="blog-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search articles…"
        className="h-9 w-full rounded-full border border-line bg-surface pl-9 pr-16 text-sm text-fg placeholder:text-subtle focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
      {value ? (
        <button type="button" onClick={() => setValue("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg">
          <X className="size-3.5" />
        </button>
      ) : (
        <Kbd className="absolute right-3 top-1/2 -translate-y-1/2">/</Kbd>
      )}
    </div>
  );
}
