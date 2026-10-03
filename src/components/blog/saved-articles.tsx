"use client";

import { BookmarkX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { readBookmarks, setBookmark, type LocalBookmark } from "@/lib/client/bookmarks";
import { formatDate } from "@/lib/utils";

export function SavedArticles() {
  const [items, setItems] = useState<LocalBookmark[] | null>(null);
  const [progress, setProgress] = useState<Record<string, { pct: number }>>({});

  useEffect(() => {
    setItems(readBookmarks());
    try {
      setProgress(JSON.parse(localStorage.getItem("studio-progress") ?? "{}"));
    } catch {
      /* ignore */
    }
  }, []);

  if (items === null)
    return (
      <div className="mt-10 space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );

  if (!items.length)
    return (
      <EmptyState
        className="mt-10"
        title="Nothing saved yet."
        description="Tap “Save” on any article and it will wait for you here."
        action={
          <Link href="/blog/" className={buttonVariants({ variant: "secondary" })}>
            Browse writing
          </Link>
        }
      />
    );

  return (
    <ul className="mt-10 border-b border-line">
      {items.map((p) => (
        <li key={p.slug} className="group flex items-start gap-4 border-t border-line py-5">
          <Link href={`/blog/${p.slug}/`} className="min-w-0 flex-1">
            {p.category ? <p className="eyebrow">{p.category}</p> : null}
            <p className="mt-1 font-medium text-fg group-hover:text-accent-strong">{p.title}</p>
            <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-subtle">
              {p.date ? formatDate(p.date, "short") : null}
              {p.readingTime ? ` · ${p.readingTime} min` : null}
              {progress[p.slug]?.pct ? ` · ${progress[p.slug]!.pct}% read` : null}
            </p>
          </Link>
          <button
            type="button"
            onClick={() => {
              setBookmark(p, false);
              setItems(readBookmarks());
            }}
            aria-label={`Remove ${p.title} from saved`}
            className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg"
          >
            <BookmarkX className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
