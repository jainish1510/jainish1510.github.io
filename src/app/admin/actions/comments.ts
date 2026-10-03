"use server";

import "@/lib/events/register";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { createComment, moderateComments } from "@/lib/repositories/comments";
import { commentModerationSchema } from "@/lib/validation";

export async function moderateAction(ids: string[], action: "APPROVED" | "REJECTED" | "SPAM" | "PENDING" | "DELETE") {
  await requireAdmin();
  const parsed = commentModerationSchema.parse({ ids, action });
  await moderateComments(parsed.ids, parsed.action);
}

/** Replying approves the parent (you don't reply to something you'd reject). */
export async function replyAction(parentId: string, content: string) {
  const user = await requireAdmin();
  const text = content.trim();
  if (text.length < 2 || text.length > 5000) return { ok: false as const, error: "Reply must be 2–5000 characters." };
  const parent = await db.comment.findUniqueOrThrow({ where: { id: parentId }, select: { postId: true, status: true } });
  if (parent.status !== "APPROVED") await moderateComments([parentId], "APPROVED");
  await createComment({ postId: parent.postId, parentId, name: user.name, content: text, isAuthor: true });
  return { ok: true as const };
}
