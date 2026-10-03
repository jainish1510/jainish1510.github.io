import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderMarkdown } from "@/components/content/markdown";
import { ArticleBody } from "@/components/blog/article-body";
import { ArticleHeader } from "@/components/blog/article-header";
import { Comments } from "@/components/blog/comments";
import { ContinueReading } from "@/components/blog/continue-reading";
import { EngagementBar } from "@/components/blog/engagement-bar";
import { PostRow } from "@/components/blog/post-items";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { getAdjacentPosts, getPublishedPostBySlug, getRelatedPosts, listPublishedSlugs } from "@/lib/repositories/posts";
import { articleSchema, breadcrumbSchema, JsonLd } from "@/lib/seo";
import { absolute, getSite } from "@/lib/site";

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listPublishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPublishedPostBySlug((await params).slug);
  if (!post) return { title: "Article not found" };
  const description = post.seoDescription ?? post.excerpt ?? post.subtitle ?? undefined;
  return {
    title: post.seoTitle ?? post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}/` },
    keywords: post.tags.map((t) => t.name),
    authors: [{ name: post.author.name }],
    openGraph: {
      type: "article",
      title: post.seoTitle ?? post.title,
      description,
      url: `/blog/${post.slug}/`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name],
      tags: post.tags.map((t) => t.name),
      section: post.category?.name,
      images: [{ url: `/og/posts/${post.slug}/image.png`, width: 1200, height: 630, alt: post.title }],
    },
    twitter: { card: "summary_large_image", title: post.seoTitle ?? post.title, description, images: [`/og/posts/${post.slug}/image.png`] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const post = getPublishedPostBySlug((await params).slug);
  if (!post) notFound();

  const site = getSite();
  const { content, toc } = renderMarkdown(post.content);
  const related = getRelatedPosts(post.id, 3);
  const adjacent = getAdjacentPosts(post.publishedAt!);
  const url = absolute(`/blog/${post.slug}/`);
  const comments = site.comments;
  const commentsOn = comments.enabled && Boolean(comments.repo && comments.repoId && comments.category && comments.categoryId);

  return (
    <article>
      <JsonLd data={articleSchema(site, post)} />
      <JsonLd data={breadcrumbSchema(site, [{ name: "Home", path: "/" }, { name: "Writing", path: "/blog/" }, { name: post.title, path: `/blog/${post.slug}/` }])} />
      <ContinueReading postId={post.id} />

      <ArticleHeader post={post} />

      <div className="container-page relative mt-14 grid gap-12 xl:grid-cols-[1fr_44rem_1fr]">
        <aside className="hidden xl:block">
          <TableOfContents toc={toc} className="sticky top-28 max-w-56" />
        </aside>
        <div className="min-w-0">
          {toc.length > 2 ? (
            <details className="mb-10 rounded-xl border border-line bg-surface px-5 py-3 xl:hidden">
              <summary className="eyebrow cursor-pointer list-none py-1">Contents ↓</summary>
              <TableOfContents toc={toc} className="pb-2 pt-3 [&>p]:hidden" />
            </details>
          ) : null}

          <div className="sticky top-16 z-30 -mx-2 mb-10 border-y border-line bg-bg/85 px-2 py-1.5 backdrop-blur-md">
            <EngagementBar
              post={{ slug: post.slug, title: post.title, subtitle: post.subtitle, category: post.category?.name ?? null, readingTime: post.readingTime, date: post.publishedAt?.toISOString() ?? null }}
              url={url}
              readingTime={post.readingTime}
              commentsEnabled={commentsOn}
            />
          </div>

          <ArticleBody postId={post.id}>{content}</ArticleBody>

          {post.tags.length ? (
            <div className="mt-16 flex flex-wrap items-center gap-2 border-t border-line pt-8">
              <span className="eyebrow mr-2">Tags</span>
              {post.tags.map((t) => (
                <Link key={t.slug} href={`/blog/?tag=${t.slug}`} className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-line-strong hover:text-fg">
                  #{t.name}
                </Link>
              ))}
            </div>
          ) : null}

          <nav aria-label="More articles" className="mt-10 grid gap-3 sm:grid-cols-2">
            {adjacent.previous ? (
              <Link href={`/blog/${adjacent.previous.slug}/`} className="group rounded-xl border border-line p-5 transition hover:border-line-strong hover:bg-surface">
                <p className="eyebrow flex items-center gap-1.5">
                  <ArrowLeft className="size-3 transition group-hover:-translate-x-0.5" /> Previous
                </p>
                <p className="mt-2 text-sm text-fg">{adjacent.previous.title}</p>
              </Link>
            ) : (
              <span />
            )}
            {adjacent.next ? (
              <Link href={`/blog/${adjacent.next.slug}/`} className="group rounded-xl border border-line p-5 text-right transition hover:border-line-strong hover:bg-surface">
                <p className="eyebrow flex items-center justify-end gap-1.5">
                  Next article <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
                </p>
                <p className="mt-2 text-sm text-fg">{adjacent.next.title}</p>
              </Link>
            ) : null}
          </nav>

          {commentsOn ? (
            <div className="mt-20">
              <Comments config={comments} />
            </div>
          ) : null}
        </div>
      </div>

      {related.length ? (
        <section aria-labelledby="related-heading" className="container-page mt-28">
          <h2 id="related-heading" className="eyebrow mb-4">
            Related articles
          </h2>
          {related.map((p) => (
            <PostRow key={p.id} post={p} />
          ))}
        </section>
      ) : null}
    </article>
  );
}
