"use client";

import { BookmarkX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { readLocalBookmarks, writeLocalBookmark } from "@/lib/client/bookmarks";
import { formatDate } from "@/lib/utils";

type Saved = { id: string; slug: string; title: string; subtitle: string | null; readingTime: number; publishedAt: string | null; category: { name: string } | null };

export function SavedArticles() {
  const [posts, setPosts] = useState<Saved[] | null>(null);
  const [progress, setProgress] = useState<Record<string, { pct: number }>>({});

  useEffect(() => {
    const local = readLocalBookmarks();
    try {
      setProgress(JSON.parse(localStorage.getItem("studio-progress") ?? "{}"));
    } catch {
      /* ignore */
    }
    fetch(`/api/bookmarks?ids=${local.map((b) => b.id).join(",")}`)
      .then((r) => r.json() as Promise<{ posts: Saved[] }>)
      .then(({ posts }) => {
        const order = new Map(local.map((b, i) => [b.id, i]));
        setPosts(posts.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)));
      })
      .catch(() => setPosts(local.map((b) => ({ id: b.id, slug: b.slug, title: b.title, subtitle: null, readingTime: 0, publishedAt: null, category: null }))));
  }, []);

  async function remove(post: Saved) {
    setPosts((p) => p?.filter((x) => x.id !== post.id) ?? null);
    writeLocalBookmark(post, false);
    await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saved: false }) }).catch(() => {});
  }

  if (posts === null)
    return (
      <div className="mt-10 space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );

  if (!posts.length)
    return (
      <EmptyState
        className="mt-10"
        title="Nothing saved yet."
        description="Tap “Save” on any article and it will wait for you here."
        action={
          <Link href="/blog" className={buttonVariants({ variant: "secondary" })}>
            Browse writing
          </Link>
        }
      />
    );

  return (
    <ul className="mt-10 border-b border-line">
      {posts.map((p) => (
        <li key={p.id} className="group flex items-start gap-4 border-t border-line py-5">
          <Link href={`/blog/${p.slug}`} className="min-w-0 flex-1">
            {p.category ? <p className="eyebrow">{p.category.name}</p> : null}
            <p className="mt-1 font-medium text-fg group-hover:text-accent-strong">{p.title}</p>
            <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-subtle">
              {p.publishedAt ? formatDate(p.publishedAt, "short") : null}
              {p.readingTime ? ` · ${p.readingTime} min` : null}
              {progress[p.id]?.pct ? ` · ${progress[p.id]!.pct}% read` : null}
            </p>
          </Link>
          <button type="button" onClick={() => remove(p)} aria-label={`Remove ${p.title} from saved`} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg">
            <BookmarkX className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
