import Link from "next/link";
import { Cover } from "@/components/portfolio/cover";
import { Badge } from "@/components/ui/primitives";
import { formatDate, initials } from "@/lib/utils";

type HeaderPost = {
  slug: string;
  title: string;
  subtitle: string | null;
  readingTime: number;
  publishedAt: Date | null;
  isDemo: boolean;
  author: { name: string };
  category: { name: string; slug: string } | null;
  cover: { path: string; alt: string } | null;
};

export function ArticleHeader({ post }: { post: HeaderPost }) {
  return (
    <header>
      <div className="container-prose pt-32 md:pt-40">
        <div className="flex items-center gap-3">
          {post.category ? (
            <Link href={`/blog?category=${post.category.slug}`} className="eyebrow !text-accent hover:!text-accent-strong">
              {post.category.name}
            </Link>
          ) : null}
          {post.isDemo ? <Badge tone="outline">demonstration content</Badge> : null}
        </div>
        <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-fg sm:text-5xl md:text-[3.5rem]">{post.title}</h1>
        {post.subtitle ? <p className="mt-5 text-balance font-serif text-xl italic leading-snug text-muted sm:text-2xl">{post.subtitle}</p> : null}
        <div className="mt-10 flex items-center gap-3">
          <span aria-hidden className="grid size-10 place-items-center rounded-full border border-line bg-surface font-mono text-xs text-fg">
            {initials(post.author.name)}
          </span>
          <div className="text-sm">
            <p className="text-fg">{post.author.name}</p>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-subtle">
              <time dateTime={post.publishedAt?.toISOString()}>{post.publishedAt ? formatDate(post.publishedAt) : "Unpublished"}</time> · {post.readingTime} min read
            </p>
          </div>
        </div>
      </div>
      <div className="container-page mt-12">
        <div className="relative aspect-[16/8] overflow-hidden rounded-2xl border border-line md:aspect-[16/7]">
          <Cover media={post.cover} seed={post.slug} priority sizes="(min-width: 1216px) 1152px, 100vw" className="absolute inset-0" />
        </div>
      </div>
    </header>
  );
}
