"use server";

import "@/lib/events/register";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import type { PostStatus } from "@/lib/constants";
import { POST_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db/client";
import { createPost, deletePost, restoreRevision, setPostStatus, updatePost } from "@/lib/repositories/posts";
import { fieldErrors, postInputSchema, type PostInput } from "@/lib/validation";

export type SavePostResult =
  | { ok: true; id: string; slug: string; status: PostStatus; savedAt: string; readingTime: number }
  | { ok: false; errors: Record<string, string> };

export async function savePostAction(id: string | null, raw: unknown, mode: "autosave" | "manual" | "publish" = "manual"): Promise<SavePostResult> {
  const user = await requireAdmin();
  const parsed = postInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const input: PostInput = { ...parsed.data, status: mode === "publish" ? "PUBLISHED" : parsed.data.status };
  try {
    const post = id ? await updatePost(id, input, mode) : await createPost(input, user.id);
    return { ok: true, id: post.id, slug: post.slug, status: post.status as PostStatus, savedAt: post.updatedAt.toISOString(), readingTime: post.readingTime };
  } catch (error) {
    console.error("savePostAction", error);
    return { ok: false, errors: { form: "Couldn't save. Your changes are still in the editor — try again." } };
  }
}

export async function setPostStatusAction(id: string, status: PostStatus) {
  await requireAdmin();
  if (!POST_STATUSES.includes(status)) throw new Error("Invalid status");
  await setPostStatus(id, status);
}

export async function deletePostAction(id: string) {
  await requireAdmin();
  await deletePost(id);
  redirect("/admin/posts");
}

export async function restoreRevisionAction(postId: string, revisionId: string) {
  await requireAdmin();
  await restoreRevision(postId, revisionId);
}

export async function createCategoryAction(name: string) {
  await requireAdmin();
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new Error("Name required");
  const { slugify } = await import("@/lib/content/text");
  return db.category.upsert({ where: { slug: slugify(clean) }, create: { name: clean, slug: slugify(clean) }, update: {} });
}
