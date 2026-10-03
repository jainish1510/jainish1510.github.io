"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BlogSearchInput } from "@/components/blog/blog-search-input";
import { FeaturedPost, PostCompact, PostRow } from "@/components/blog/post-items";
import { Reveal } from "@/components/interaction/reveal";
import { EmptyState } from "@/components/ui/primitives";
import { loadSearchIndex } from "@/lib/search/client";
import type { PostCard } from "@/lib/store/types";
import { cn } from "@/lib/utils";

type Counted = { slug: string; name: string; count: number };

/**
 * The blog index. Filtering by ?category=, ?tag= and ?q= happens in the
 * browser (a static site has no server to filter on), so every filtered view
 * is still a shareable URL.
 */
export function BlogBrowser({
  eyebrow,
  headline,
  posts,
  featured,
  startHere,
  categories,
  tags,
}: {
  eyebrow: string;
  headline: string;
  posts: PostCard[];
  featured: PostCard | null;
  startHere: PostCard[];
  categories: Counted[];
  tags: Counted[];
}) {
  const params = useSearchParams();
  const category = params.get("category") ?? undefined;
  const tag = params.get("tag") ?? undefined;
  const query = params.get("q")?.trim().slice(0, 100) || undefined;
  const filtering = Boolean(category || tag || query);

  const [ranked, setRanked] = useState<string[] | null>(null);
  useEffect(() => {
    if (!query) {
      setRanked(null);
      return;
    }
    let cancelled = false;
    loadSearchIndex()
      .then((index) => !cancelled && setRanked(index.search(query, { types: ["post"], limit: 50 }).map((r) => r.id)))
      .catch(() => !cancelled && setRanked([]));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const stream = useMemo(() => {
    let list = posts.filter((p) => (!category || p.category?.slug === category) && (!tag || p.tags.some((t) => t.slug === tag)));
    if (query && ranked) {
      const order = new Map(ranked.map((id, i) => [id, i]));
      list = list.filter((p) => order.has(p.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    } else if (query) list = [];
    if (!filtering && featured) list = list.filter((p) => p.id !== featured.id);
    return list;
  }, [posts, category, tag, query, ranked, filtering, featured]);

  const href = (next: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/blog/?${s}` : "/blog/";
  };
  const searching = Boolean(query) && ranked === null;

  return (
    <div className="pt-32 md:pt-44">
      <header className="container-page">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-6 max-w-4xl text-balance text-4xl font-medium leading-[1.05] tracking-[-0.04em] text-fg sm:text-6xl md:text-7xl">{headline}</h1>
      </header>

      <div className="container-page mt-16 flex flex-col gap-4 border-y border-line py-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Categories" className="-mx-1 flex gap-1 overflow-x-auto pb-1 md:pb-0">
          <Link href={href({ q: query })} className={cn("shrink-0 rounded-full px-3 py-1.5 text-sm transition", !category ? "bg-fg text-bg" : "text-muted hover:text-fg")}>
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={href({ category: c.slug, q: query })}
              aria-current={category === c.slug ? "page" : undefined}
              className={cn("shrink-0 rounded-full px-3 py-1.5 text-sm transition", category === c.slug ? "bg-fg text-bg" : "text-muted hover:text-fg")}
            >
              {c.name} <span className="font-mono text-[0.6875rem] opacity-60">{c.count}</span>
            </Link>
          ))}
        </nav>
        <BlogSearchInput initial={query ?? ""} />
      </div>

      {!filtering && featured ? (
        <Reveal className="container-page mt-12">
          <FeaturedPost post={featured} />
        </Reveal>
      ) : null}

      <div className="container-page mt-12 grid gap-16 lg:grid-cols-[1fr_18rem]">
        <section aria-label="Articles">
          {filtering ? (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>
                {searching ? "Searching…" : `${stream.length} ${stream.length === 1 ? "article" : "articles"}`}
                {query ? ` matching “${query}”` : ""}
                {tag ? ` tagged #${tags.find((t) => t.slug === tag)?.name ?? tag}` : ""}
              </span>
              <Link href="/blog/" className="rounded-full border border-line px-2.5 py-0.5 text-xs hover:text-fg">
                Clear filters ×
              </Link>
            </div>
          ) : (
            <p className="eyebrow mb-2">Recent</p>
          )}
          {stream.length ? (
            stream.map((p, i) => <PostRow key={p.id} post={p} index={i} />)
          ) : searching ? null : filtering ? (
            <EmptyState title="No matching articles." description="Try another keyword." />
          ) : (
            <EmptyState title="Nothing published yet." description="The first idea is coming soon." />
          )}
        </section>

        <aside className="space-y-12 lg:sticky lg:top-24 lg:self-start">
          {startHere.length ? (
            <div>
              <p className="eyebrow mb-2">Start here</p>
              {startHere.map((p, i) => (
                <PostCompact key={p.id} post={p} rank={i + 1} />
              ))}
            </div>
          ) : null}
          {tags.length ? (
            <div>
              <p className="eyebrow mb-4">Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Link
                    key={t.slug}
                    href={href({ tag: tag === t.slug ? undefined : t.slug, category })}
                    className={cn("rounded-full border px-2.5 py-1 text-xs transition", tag === t.slug ? "border-accent/60 bg-accent-soft text-accent" : "border-line text-muted hover:border-line-strong hover:text-fg")}
                  >
                    {t.name} <span className="opacity-50">{t.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          <div className="rounded-xl border border-line p-5">
            <p className="text-sm text-fg">Subscribe via RSS</p>
            <p className="mt-1 text-xs text-muted">No newsletter, no tracking — just a feed.</p>
            <a href="/rss.xml" className="mt-3 inline-block font-mono text-xs text-accent link-underline">
              /rss.xml
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
