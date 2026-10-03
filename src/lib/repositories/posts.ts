import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";
import type { PostStatus } from "@/lib/constants";
import { makeExcerpt, readingTime, slugify } from "@/lib/content/text";
import { bus } from "@/lib/events/bus";
import type { PostInput } from "@/lib/validation";

/** Shape used by every public list/card. */
export const postCardSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  excerpt: true,
  readingTime: true,
  publishedAt: true,
  featured: true,
  isDemo: true,
  category: { select: { name: true, slug: true } },
  tags: { select: { name: true, slug: true }, orderBy: { name: "asc" } },
  cover: { select: { path: true, alt: true, width: true, height: true } },
  _count: { select: { views: true, likes: true, comments: { where: { status: "APPROVED" } } } },
} satisfies Prisma.PostSelect;

export type PostCard = Prisma.PostGetPayload<{ select: typeof postCardSelect }>;

const published = (): Prisma.PostWhereInput => ({ status: "PUBLISHED", publishedAt: { lte: new Date() } });

export type PostListFilter = { category?: string; tag?: string; area?: string; take?: number; skip?: number };

export async function listPublishedPosts(filter: PostListFilter = {}) {
  const where: Prisma.PostWhereInput = {
    ...published(),
    ...(filter.category ? { category: { slug: filter.category } } : {}),
    ...(filter.tag ? { tags: { some: { slug: filter.tag } } } : {}),
    ...(filter.area ? { areas: { some: { slug: filter.area } } } : {}),
  };
  const [posts, total] = await Promise.all([
    db.post.findMany({ where, select: postCardSelect, orderBy: { publishedAt: "desc" }, take: filter.take, skip: filter.skip }),
    db.post.count({ where }),
  ]);
  return { posts, total };
}

export async function getFeaturedPost() {
  return (
    (await db.post.findFirst({ where: { ...published(), featured: true }, select: postCardSelect, orderBy: { publishedAt: "desc" } })) ??
    (await db.post.findFirst({ where: published(), select: postCardSelect, orderBy: { publishedAt: "desc" } }))
  );
}

export async function getPopularPosts(take = 4) {
  const posts = await db.post.findMany({ where: published(), select: postCardSelect });
  return posts.sort((a, b) => b._count.views + b._count.likes * 5 - (a._count.views + a._count.likes * 5)).slice(0, take);
}

export async function getPublishedPostBySlug(slug: string) {
  return db.post.findFirst({
    where: { slug, ...published() },
    include: {
      author: { select: { name: true } },
      category: true,
      tags: { orderBy: { name: "asc" } },
      areas: { select: { name: true, slug: true } },
      cover: true,
      _count: { select: { views: true, likes: true, bookmarks: true, comments: { where: { status: "APPROVED" } } } },
    },
  });
}

export async function getPostForPreview(id: string) {
  return db.post.findUnique({
    where: { id },
    include: { author: { select: { name: true } }, category: true, tags: true, areas: true, cover: true },
  });
}

export async function getAdjacentPosts(publishedAt: Date) {
  const [previous, next] = await Promise.all([
    db.post.findFirst({ where: { ...published(), publishedAt: { lt: publishedAt } }, select: postCardSelect, orderBy: { publishedAt: "desc" } }),
    db.post.findFirst({ where: { ...published(), publishedAt: { gt: publishedAt, lte: new Date() } }, select: postCardSelect, orderBy: { publishedAt: "asc" } }),
  ]);
  return { previous, next };
}

/** Related = shared tags (×2) + same category (×3) + shared research areas (×2). */
export async function getRelatedPosts(postId: string, take = 3) {
  const post = await db.post.findUnique({ where: { id: postId }, select: { categoryId: true, tags: { select: { id: true } }, areas: { select: { id: true } } } });
  if (!post) return [];
  const candidates = await db.post.findMany({
    where: { ...published(), id: { not: postId } },
    select: { ...postCardSelect, categoryId: true, tags: { select: { id: true, name: true, slug: true } }, areas: { select: { id: true } } },
  });
  const tagIds = new Set(post.tags.map((t) => t.id));
  const areaIds = new Set(post.areas.map((a) => a.id));
  return candidates
    .map((c) => ({
      post: c,
      score:
        c.tags.filter((t) => tagIds.has(t.id)).length * 2 +
        (post.categoryId && c.categoryId === post.categoryId ? 3 : 0) +
        c.areas.filter((a) => areaIds.has(a.id)).length * 2,
    }))
    .sort((a, b) => b.score - a.score || (b.post.publishedAt?.getTime() ?? 0) - (a.post.publishedAt?.getTime() ?? 0))
    .slice(0, take)
    .map((r) => r.post);
}

export async function listCategoriesWithCounts() {
  return db.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { posts: { where: published() } } } },
  });
}

export async function listTagsWithCounts() {
  const tags = await db.tag.findMany({ include: { _count: { select: { posts: { where: published() } } } }, orderBy: { name: "asc" } });
  return tags.filter((t) => t._count.posts > 0);
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export type AdminPostFilter = { status?: PostStatus | "ALL"; q?: string; category?: string; sort?: "updated" | "published" | "views" };

export async function adminListPosts(filter: AdminPostFilter = {}) {
  const where: Prisma.PostWhereInput = {
    ...(filter.status && filter.status !== "ALL" ? { status: filter.status } : {}),
    ...(filter.category ? { categoryId: filter.category } : {}),
    ...(filter.q ? { OR: [{ title: { contains: filter.q } }, { subtitle: { contains: filter.q } }, { slug: { contains: filter.q } }] } : {}),
  };
  const posts = await db.post.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      featured: true,
      isDemo: true,
      publishedAt: true,
      updatedAt: true,
      readingTime: true,
      category: { select: { name: true } },
      _count: { select: { views: true, likes: true, comments: true } },
    },
    orderBy: filter.sort === "published" ? { publishedAt: "desc" } : { updatedAt: "desc" },
  });
  return filter.sort === "views" ? posts.sort((a, b) => b._count.views - a._count.views) : posts;
}

export async function getPostForEdit(id: string) {
  return db.post.findUnique({
    where: { id },
    include: {
      tags: { select: { name: true } },
      areas: { select: { id: true } },
      cover: { select: { id: true, path: true, alt: true } },
      revisions: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, note: true, createdAt: true, title: true } },
    },
  });
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "untitled";
  let slug = root;
  for (let i = 2; ; i++) {
    const clash = await db.post.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
}

function tagConnect(names: string[]) {
  // First spelling wins: ["Machine Learning", "machine learning"] → one tag.
  const unique = new Map<string, string>();
  for (const n of names) if (slugify(n) && !unique.has(slugify(n))) unique.set(slugify(n), n.trim());
  return [...unique].map(([slug, name]) => ({ where: { slug }, create: { slug, name } }));
}

function derived(input: PostInput, existingPublishedAt?: Date | null) {
  const publishedAt =
    input.status === "PUBLISHED" ? (input.publishedAt ?? existingPublishedAt ?? new Date()) : (input.publishedAt ?? existingPublishedAt ?? null);
  return {
    readingTime: readingTime(input.content),
    excerpt: input.excerpt ?? (input.content ? makeExcerpt(input.content) : null),
    publishedAt,
  };
}

export async function createPost(input: PostInput, authorId: string) {
  const slug = await uniqueSlug(input.slug || input.title);
  const post = await db.post.create({
    data: {
      title: input.title,
      subtitle: input.subtitle,
      slug,
      content: input.content,
      status: input.status,
      featured: input.featured,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      ...derived(input),
      author: { connect: { id: authorId } },
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      ...(input.coverId ? { cover: { connect: { id: input.coverId } } } : {}),
      tags: { connectOrCreate: tagConnect(input.tags) },
      areas: { connect: input.areaIds.map((id) => ({ id })) },
      revisions: { create: { title: input.title, subtitle: input.subtitle, content: input.content, note: "created" } },
    },
  });
  await bus.emit("post.saved", { id: post.id, slug: post.slug, status: post.status });
  if (post.status === "PUBLISHED") await bus.emit("post.published", { id: post.id, slug: post.slug });
  return post;
}

const REVISION_INTERVAL_MS = 10 * 60 * 1000;

export async function updatePost(id: string, input: PostInput, note: "autosave" | "manual" | "publish" = "manual") {
  const existing = await db.post.findUniqueOrThrow({ where: { id }, select: { slug: true, status: true, publishedAt: true, content: true, title: true } });
  const slug = input.slug === existing.slug ? existing.slug : await uniqueSlug(input.slug, id);
  const post = await db.post.update({
    where: { id },
    data: {
      title: input.title,
      subtitle: input.subtitle,
      slug,
      content: input.content,
      status: input.status,
      featured: input.featured,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      ...derived(input, existing.publishedAt),
      category: input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true },
      cover: input.coverId ? { connect: { id: input.coverId } } : { disconnect: true },
      tags: { set: [], connectOrCreate: tagConnect(input.tags) },
      areas: { set: input.areaIds.map((areaId) => ({ id: areaId })) },
    },
  });

  // Snapshot a revision on manual saves/publishes, and on autosaves at most every 10 minutes.
  if (existing.content !== input.content || existing.title !== input.title) {
    const last = await db.postRevision.findFirst({ where: { postId: id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    if (note !== "autosave" || !last || Date.now() - last.createdAt.getTime() > REVISION_INTERVAL_MS) {
      await db.postRevision.create({ data: { postId: id, title: input.title, subtitle: input.subtitle, content: input.content, note } });
    }
  }

  await bus.emit("post.saved", { id, slug: post.slug, previousSlug: existing.slug, status: post.status });
  if (post.status === "PUBLISHED" && existing.status !== "PUBLISHED") await bus.emit("post.published", { id, slug: post.slug });
  return post;
}

export async function setPostStatus(id: string, status: PostStatus) {
  const existing = await db.post.findUniqueOrThrow({ where: { id }, select: { status: true, publishedAt: true } });
  const post = await db.post.update({
    where: { id },
    data: { status, publishedAt: status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt },
  });
  await bus.emit("post.saved", { id, slug: post.slug, status });
  if (status === "PUBLISHED" && existing.status !== "PUBLISHED") await bus.emit("post.published", { id, slug: post.slug });
  return post;
}

export async function restoreRevision(postId: string, revisionId: string) {
  const rev = await db.postRevision.findFirstOrThrow({ where: { id: revisionId, postId } });
  const post = await db.post.update({ where: { id: postId }, data: { title: rev.title, subtitle: rev.subtitle, content: rev.content, readingTime: readingTime(rev.content) } });
  await db.postRevision.create({ data: { postId, title: rev.title, subtitle: rev.subtitle, content: rev.content, note: "restored" } });
  await bus.emit("post.saved", { id: postId, slug: post.slug, status: post.status });
  return post;
}

export async function deletePost(id: string) {
  const post = await db.post.delete({ where: { id } });
  await bus.emit("post.deleted", { id, slug: post.slug });
  return post;
}

export async function postStatusCounts() {
  const groups = await db.post.groupBy({ by: ["status"], _count: { _all: true } });
  const out: Record<PostStatus, number> = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const g of groups) out[g.status as PostStatus] = g._count._all;
  return out;
}
