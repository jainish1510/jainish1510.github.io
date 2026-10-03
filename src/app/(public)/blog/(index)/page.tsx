import type { Metadata } from "next";
import Link from "next/link";
import { BlogSearchInput } from "@/components/blog/blog-search-input";
import { FeaturedPost, PostCompact, PostRow } from "@/components/blog/post-items";
import { Reveal } from "@/components/interaction/reveal";
import { EmptyState } from "@/components/ui/primitives";
import { getFeaturedPost, getPopularPosts, listCategoriesWithCounts, listPublishedPosts, listTagsWithCounts, type PostCard } from "@/lib/repositories/posts";
import { getSearchIndex } from "@/lib/search";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Writing",
  description: "Ideas, experiments, technical notes, research, and things I'm figuring out.",
  alternates: { canonical: "/blog" },
};

type Props = { searchParams: Promise<{ category?: string; tag?: string; q?: string }> };

export default async function BlogPage({ searchParams }: Props) {
  const { category, tag, q } = await searchParams;
  const query = q?.trim().slice(0, 100);
  const filtering = Boolean(category || tag || query);

  const [settings, featured, popular, categories, tags, list] = await Promise.all([
    getSettings(),
    getFeaturedPost(),
    getPopularPosts(5),
    listCategoriesWithCounts(),
    listTagsWithCounts(),
    listPublishedPosts({ category, tag }),
  ]);

  let posts: PostCard[] = list.posts;
  if (query) {
    const hits = (await getSearchIndex()).search(query, { types: ["post"], limit: 50 });
    const order = new Map(hits.map((h, i) => [h.id, i]));
    posts = posts.filter((p) => order.has(p.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  }
  const showFeatured = !filtering && featured;
  const stream = showFeatured ? posts.filter((p) => p.id !== featured.id) : posts;

  const href = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/blog?${s}` : "/blog";
  };

  return (
    <div className="pt-32 md:pt-44">
      <header className="container-page">
        <p className="eyebrow">{settings["blog.heroTitle"]}</p>
        <h1 className="mt-6 max-w-4xl text-balance text-4xl font-medium leading-[1.05] tracking-[-0.04em] text-fg sm:text-6xl md:text-7xl">{settings["blog.heroSubtitle"]}</h1>
      </header>

      <div className="container-page mt-16 flex flex-col gap-4 border-y border-line py-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Categories" className="-mx-1 flex gap-1 overflow-x-auto pb-1 md:pb-0">
          <Link href={href({ q: query })} className={cn("shrink-0 rounded-full px-3 py-1.5 text-sm transition", !category ? "bg-fg text-bg" : "text-muted hover:text-fg")}>
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={href({ category: c.slug, q: query })}
              aria-current={category === c.slug ? "page" : undefined}
              className={cn("shrink-0 rounded-full px-3 py-1.5 text-sm transition", category === c.slug ? "bg-fg text-bg" : "text-muted hover:text-fg")}
            >
              {c.name} <span className="font-mono text-[0.6875rem] opacity-60">{c._count.posts}</span>
            </Link>
          ))}
        </nav>
        <BlogSearchInput initial={query ?? ""} />
      </div>

      {showFeatured ? (
        <Reveal className="container-page mt-12">
          <FeaturedPost post={featured} />
        </Reveal>
      ) : null}

      <div className="container-page mt-12 grid gap-16 lg:grid-cols-[1fr_18rem]">
        <section aria-label="Articles">
          {filtering ? (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>
                {stream.length} {stream.length === 1 ? "article" : "articles"}
                {query ? ` matching “${query}”` : ""}
                {tag ? ` tagged #${tags.find((t) => t.slug === tag)?.name ?? tag}` : ""}
              </span>
              <Link href="/blog" className="rounded-full border border-line px-2.5 py-0.5 text-xs hover:text-fg">
                Clear filters ×
              </Link>
            </div>
          ) : (
            <p className="eyebrow mb-2">Recent</p>
          )}
          {stream.length ? (
            stream.map((p, i) => <PostRow key={p.id} post={p} index={i} />)
          ) : filtering ? (
            <EmptyState title="No matching articles." description="Try another keyword." />
          ) : (
            <EmptyState title="Nothing published yet." description="The first idea is coming soon." />
          )}
        </section>

        <aside className="space-y-12 lg:sticky lg:top-24 lg:self-start">
          {popular.length ? (
            <div>
              <p className="eyebrow mb-2">Most read</p>
              {popular.map((p, i) => (
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
                    key={t.id}
                    href={href({ tag: tag === t.slug ? undefined : t.slug, category })}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition",
                      tag === t.slug ? "border-accent/60 bg-accent-soft text-accent" : "border-line text-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    {t.name} <span className="opacity-50">{t._count.posts}</span>
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
