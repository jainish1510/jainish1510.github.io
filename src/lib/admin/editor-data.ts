import "server-only";
import type { EditorPost } from "@/components/admin/editor/post-editor";
import type { EditorOptions } from "@/components/admin/editor/settings-panel";
import { db } from "@/lib/db/client";
import { getPostForEdit } from "@/lib/repositories/posts";

export async function getEditorOptions(): Promise<EditorOptions> {
  const [categories, tags, areas] = await Promise.all([
    db.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    db.researchArea.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);
  return { categories, tags: tags.map((t) => t.name), areas };
}

const toLocalInput = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function emptyEditorPost(): EditorPost {
  return {
    id: null,
    title: "",
    subtitle: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "DRAFT",
    featured: false,
    categoryId: "",
    coverId: "",
    coverPath: "",
    tags: [],
    areaIds: [],
    publishedAt: "",
    seoTitle: "",
    seoDescription: "",
    updatedAt: null,
    revisions: [],
  };
}

export async function loadEditorPost(id: string): Promise<EditorPost | null> {
  const post = await getPostForEdit(id);
  if (!post) return null;
  return {
    id: post.id,
    title: post.title,
    subtitle: post.subtitle ?? "",
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    status: post.status as EditorPost["status"],
    featured: post.featured,
    categoryId: post.categoryId ?? "",
    coverId: post.cover?.id ?? "",
    coverPath: post.cover?.path ?? "",
    tags: post.tags.map((t) => t.name),
    areaIds: post.areas.map((a) => a.id),
    publishedAt: toLocalInput(post.publishedAt),
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    updatedAt: post.updatedAt.toISOString(),
    revisions: post.revisions.map((r) => ({ id: r.id, note: r.note, createdAt: r.createdAt.toISOString(), title: r.title })),
  };
}
