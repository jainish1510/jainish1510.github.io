import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Cover } from "@/components/portfolio/cover";
import { Badge } from "@/components/ui/primitives";
import type { PostCard } from "@/lib/store/types";
import { cn, formatDate } from "@/lib/utils";

export function PostMeta({ post, className }: { post: Pick<PostCard, "publishedAt" | "readingTime">; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-subtle", className)}>
      <time dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>{formatDate(post.publishedAt, "short")}</time>
      <span aria-hidden>·</span>
      <span>{post.readingTime} min read</span>
    </p>
  );
}

/** Editorial list row — the default way writing appears across the site. */
export function PostRow({ post, index, showCover = true }: { post: PostCard; index?: number; showCover?: boolean }) {
  return (
    <article className="group/post relative">
      <Link href={`/blog/${post.slug}`} data-cursor="read" className="grid gap-5 border-t border-line py-7 sm:grid-cols-[auto_1fr_auto] sm:items-start sm:gap-8">
        {typeof index === "number" ? <span className="hidden pt-1 font-mono text-xs text-subtle sm:block">{String(index + 1).padStart(2, "0")}</span> : null}
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            {post.category ? <span className="eyebrow !text-accent">{post.category.name}</span> : null}
            {post.isDemo ? <Badge tone="outline">demo</Badge> : null}
          </div>
          <h3 className="text-balance text-xl font-medium tracking-[-0.02em] text-fg transition-colors group-hover/post:text-accent-strong sm:text-2xl">{post.title}</h3>
          {post.subtitle ? <p className="mt-1.5 font-serif text-[1.0625rem] italic text-muted">{post.subtitle}</p> : null}
          {post.excerpt ? <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted">{post.excerpt}</p> : null}
          <PostMeta post={post} className="mt-4" />
        </div>
        {showCover ? (
          <div className="relative hidden aspect-[4/3] w-44 overflow-hidden rounded-xl border border-line sm:block">
            <Cover media={post.cover} seed={post.slug} sizes="176px" className="size-full" imgClassName="transition duration-700 ease-[var(--ease-out-expo)] group-hover/post:scale-105" />
          </div>
        ) : (
          <ArrowUpRight className="hidden size-5 text-subtle transition group-hover/post:-translate-y-0.5 group-hover/post:translate-x-0.5 group-hover/post:text-fg sm:block" />
        )}
      </Link>
    </article>
  );
}

export function FeaturedPost({ post }: { post: PostCard }) {
  return (
    <article className="group/feat">
      <Link href={`/blog/${post.slug}`} data-cursor="read" className="grid overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong lg:grid-cols-[1.25fr_1fr]">
        <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[22rem]">
          <Cover media={post.cover} seed={post.slug} sizes="(min-width: 1024px) 55vw, 100vw" priority className="absolute inset-0" imgClassName="transition duration-1000 ease-[var(--ease-out-expo)] group-hover/feat:scale-[1.03]" />
          <Badge tone="accent" className="absolute left-5 top-5 backdrop-blur">Featured</Badge>
        </div>
        <div className="flex flex-col justify-between gap-8 p-6 sm:p-8">
          <div>
            <div className="flex items-center gap-2">
              {post.category ? <span className="eyebrow !text-accent">{post.category.name}</span> : null}
              {post.isDemo ? <Badge tone="outline">demo</Badge> : null}
            </div>
            <h3 className="mt-4 text-balance text-2xl font-medium leading-tight tracking-[-0.025em] text-fg sm:text-3xl">{post.title}</h3>
            {post.subtitle ? <p className="mt-3 font-serif text-lg italic text-muted">{post.subtitle}</p> : null}
            {post.excerpt ? <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p> : null}
          </div>
          <div className="flex items-end justify-between gap-4">
            <PostMeta post={post} />
            <span className="flex items-center gap-1.5 text-sm text-fg">
              Read <ArrowUpRight className="size-4 transition group-hover/feat:-translate-y-0.5 group-hover/feat:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function PostCompact({ post, rank }: { post: PostCard; rank?: number }) {
  return (
    <Link href={`/blog/${post.slug}`} data-cursor="read" className="group/c flex gap-4 border-t border-line py-4">
      {rank ? <span className="font-mono text-2xl font-light tabular-nums text-subtle">{rank}</span> : null}
      <div className="min-w-0">
        <p className="text-[0.9375rem] font-medium leading-snug text-fg transition-colors group-hover/c:text-accent-strong">{post.title}</p>
        <PostMeta post={post} className="mt-2" />
      </div>
    </Link>
  );
}
