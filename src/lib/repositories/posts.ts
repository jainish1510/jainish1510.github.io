import "server-only";
import { getContent } from "@/lib/store/load";
import type { Post, PostCard } from "@/lib/store/types";

export type { PostCard };

const toCard = ({ content: _c, areas: _a, seoTitle: _t, seoDescription: _d, updatedAt: _u, author: _au, status: _s, ...card }: Post): PostCard => card;

/** Published, and not dated after the moment of the build. */
function published(): Post[] {
  const { posts, builtAt } = getContent();
  return posts
    .filter((p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt <= builtAt)
    .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime());
}

export type PostListFilter = { category?: string; tag?: string; area?: string; take?: number; skip?: number };

export function listPublishedPosts(filter: PostListFilter = {}) {
  const all = published().filter(
    (p) =>
      (!filter.category || p.category?.slug === filter.category) &&
      (!filter.tag || p.tags.some((t) => t.slug === filter.tag)) &&
      (!filter.area || p.areas.some((a) => a.slug === filter.area)),
  );
  const start = filter.skip ?? 0;
  const posts = all.slice(start, filter.take ? start + filter.take : undefined).map(toCard);
  return { posts, total: all.length };
}

export function getFeaturedPost(): PostCard | null {
  const all = published();
  const post = all.find((p) => p.featured) ?? all[0];
  return post ? toCard(post) : null;
}

/** "Start here": featured posts first, then the newest. */
export function getStartHerePosts(take = 4): PostCard[] {
  const all = published();
  return [...all.filter((p) => p.featured), ...all.filter((p) => !p.featured)].slice(0, take).map(toCard);
}

export function getPublishedPostBySlug(slug: string): Post | null {
  return published().find((p) => p.slug === slug) ?? null;
}

export function listPublishedSlugs(): string[] {
  return published().map((p) => p.slug);
}

export function getAdjacentPosts(publishedAt: Date) {
  const all = published(); // newest first
  const i = all.findIndex((p) => p.publishedAt!.getTime() === publishedAt.getTime());
  return { previous: all[i + 1] ? toCard(all[i + 1]!) : null, next: i > 0 ? toCard(all[i - 1]!) : null };
}

/** Related = shared tags (×2) + same category (×3) + shared research areas (×2). */
export function getRelatedPosts(postId: string, take = 3): PostCard[] {
  const all = published();
  const base = all.find((p) => p.id === postId);
  if (!base) return [];
  const tags = new Set(base.tags.map((t) => t.slug));
  const areas = new Set(base.areas.map((a) => a.slug));
  return all
    .filter((p) => p.id !== postId)
    .map((p) => ({
      p,
      score: p.tags.filter((t) => tags.has(t.slug)).length * 2 + (base.category && p.category?.slug === base.category.slug ? 3 : 0) + p.areas.filter((a) => areas.has(a.slug)).length * 2,
    }))
    .sort((a, b) => b.score - a.score || b.p.publishedAt!.getTime() - a.p.publishedAt!.getTime())
    .slice(0, take)
    .map((r) => toCard(r.p));
}

export function listCategoriesWithCounts() {
  const all = published();
  return getContent().categories.map((c) => ({ ...c, _count: { posts: all.filter((p) => p.category?.slug === c.slug).length } }));
}

export function listTagsWithCounts() {
  const counts = new Map<string, { id: string; name: string; slug: string; _count: { posts: number } }>();
  for (const p of published()) for (const t of p.tags) {
    const hit = counts.get(t.slug) ?? { id: t.slug, name: t.name, slug: t.slug, _count: { posts: 0 } };
    hit._count.posts++;
    counts.set(t.slug, hit);
  }
  return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));
}
